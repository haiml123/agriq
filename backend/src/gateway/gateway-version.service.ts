import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { File as MulterFile } from 'multer';
import * as tar from 'tar';
import { BlobServiceClient } from '@azure/storage-blob';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site';
import { AppUser } from '../types/user.type';
import { CreateGatewayVersionDto, SetActiveGatewayVersionDto } from './dto';

@Injectable()
export class GatewayVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteAccess: SiteAccessService,
  ) {}

  private getGatewayStorageDir() {
    return path.join(process.cwd(), 'storage', 'gateways');
  }

  private getStorageConnectionString() {
    return process.env.AZURE_STORAGE_CONNECTION_STRING;
  }

  private getStorageContainerName() {
    return process.env.GATEWAY_STORAGE_CONTAINER || 'gateway-updates';
  }

  private async getContainerClient() {
    const connectionString = this.getStorageConnectionString();
    if (!connectionString) {
      throw new BadRequestException(
        'AZURE_STORAGE_CONNECTION_STRING is not configured',
      );
    }

    const service = BlobServiceClient.fromConnectionString(connectionString);
    const container = service.getContainerClient(
      this.getStorageContainerName(),
    );
    await container.createIfNotExists();
    return container;
  }

  private async readBlobJson(blobClient: {
    download: () => Promise<{
      readableStreamBody?: NodeJS.ReadableStream | null;
    }>;
  }) {
    const download = await blobClient.download();
    const stream = download.readableStreamBody;
    if (!stream) {
      throw new NotFoundException('Gateway manifest not found');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(raw);
  }

  private async extractManifestFromTar(
    filePath: string,
    gzip: boolean,
  ): Promise<Record<string, unknown>> {
    let manifestRaw = '';
    let found = false;

    await tar.t({
      file: filePath,
      gzip,
      onentry: (entry) => {
        const entryPath = entry.path.replace(/^\.\/+/, '');
        if (entryPath.endsWith('manifest.json')) {
          found = true;
          entry.on('data', (chunk) => {
            manifestRaw += chunk.toString('utf8');
          });
        } else {
          entry.resume();
        }
      },
    });

    if (!found) {
      throw new BadRequestException('manifest.json not found in tar');
    }

    try {
      return JSON.parse(manifestRaw);
    } catch {
      throw new BadRequestException('manifest.json is not valid JSON');
    }
  }

  async listBundleManifests() {
    const container = await this.getContainerClient();
    const manifests: any[] = [];

    for await (const blob of container.listBlobsFlat({
      prefix: 'versions/',
    })) {
      if (!blob.name.endsWith('/manifest.json')) {
        continue;
      }

      try {
        const manifest = await this.readBlobJson(
          container.getBlockBlobClient(blob.name),
        );
        if (manifest && typeof manifest.version === 'string') {
          manifests.push(manifest);
        }
      } catch {
        continue;
      }
    }

    manifests.sort((a, b) => {
      const aDate = a?.uploadedAt ? Date.parse(a.uploadedAt) : 0;
      const bDate = b?.uploadedAt ? Date.parse(b.uploadedAt) : 0;
      return bDate - aDate;
    });

    return { ok: true, versions: manifests };
  }

  async getLatestManifest() {
    const container = await this.getContainerClient();
    try {
      const blob = container.getBlockBlobClient('latest.json');
      const manifest = await this.readBlobJson(blob);
      return { ok: true, manifest };
    } catch {
      throw new NotFoundException('Gateway manifest not found');
    }
  }

  async getBundleFile(version: string) {
    const container = await this.getContainerClient();
    try {
      const manifest = await this.readBlobJson(
        container.getBlockBlobClient(`versions/${version}/manifest.json`),
      );
      const filename = manifest?.filename;
      if (!filename || typeof filename !== 'string') {
        throw new NotFoundException('Gateway bundle not found');
      }
      const bundleBlob = container.getBlockBlobClient(
        `versions/${version}/${filename}`,
      );
      const download = await bundleBlob.download();
      const stream = download.readableStreamBody;
      if (!stream) {
        throw new NotFoundException('Gateway bundle not found');
      }
      return { filename, stream };
    } catch {
      throw new NotFoundException('Gateway version not found');
    }
  }

  async getActiveBundleFile() {
    const active = await this.prisma.gatewayVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { version: true },
    });

    if (!active?.version) {
      throw new NotFoundException('Active gateway version not set');
    }

    return this.getBundleFile(active.version);
  }

  async uploadBundle(user: AppUser, file?: MulterFile) {
    this.siteAccess.ensureSuperAdmin(user);

    if (!file || !file.buffer) {
      throw new BadRequestException('file is required');
    }

    const md5 = createHash('md5').update(file.buffer).digest('hex');
    const originalName = file.originalname?.trim() || 'gateway-bundle.tar';
    const isTarGz = originalName.endsWith('.tar.gz');
    const extension = isTarGz
      ? '.tar.gz'
      : path.extname(originalName) || '.tar';

    const storageDir = this.getGatewayStorageDir();
    const tempDir = path.join(storageDir, 'tmp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `${randomUUID()}${extension}`);
    await fs.writeFile(tempPath, file.buffer);

    const manifestFromTar = await this.extractManifestFromTar(
      tempPath,
      isTarGz,
    );
    const version = manifestFromTar?.version;
    if (!version || typeof version !== 'string') {
      await fs.rm(tempPath, { force: true });
      throw new BadRequestException('manifest.json must include version');
    }

    const manifestFilename =
      typeof manifestFromTar?.filename === 'string' &&
      manifestFromTar.filename.trim().length
        ? manifestFromTar.filename.trim()
        : originalName;
    const safeFilename = manifestFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const bundleName = safeFilename.endsWith(extension)
      ? safeFilename
      : `${safeFilename}${extension}`;

    const payload = {
      ...manifestFromTar,
      version,
      filename: bundleName,
      size: file.size,
      md5,
      uploadedAt: new Date().toISOString(),
    };

    const container = await this.getContainerClient();
    const manifestBlob = container.getBlockBlobClient(
      `versions/${version}/manifest.json`,
    );
    if (await manifestBlob.exists()) {
      await fs.rm(tempPath, { force: true });
      throw new BadRequestException('Gateway version already exists');
    }
    const contentType = isTarGz ? 'application/gzip' : 'application/x-tar';
    await container
      .getBlockBlobClient(`versions/${version}/${bundleName}`)
      .uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
    await container
      .getBlockBlobClient(`versions/${version}/manifest.json`)
      .uploadData(Buffer.from(JSON.stringify(payload, null, 2)), {
        blobHTTPHeaders: { blobContentType: 'application/json' },
      });
    await container
      .getBlockBlobClient('latest.json')
      .uploadData(Buffer.from(JSON.stringify(payload, null, 2)), {
        blobHTTPHeaders: { blobContentType: 'application/json' },
      });

    await fs.rm(tempPath, { force: true });
    return { ok: true, manifest: payload };
  }

  async listGatewayVersions(_user: AppUser) {
    return this.prisma.gatewayVersion.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getActiveGatewayVersion(_user: AppUser) {
    return this.prisma.gatewayVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGatewayVersion(user: AppUser, dto: CreateGatewayVersionDto) {
    this.siteAccess.ensureSuperAdmin(user);

    const version = dto.version?.trim();
    if (!version) {
      throw new BadRequestException('version is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.gatewayVersion.create({
        data: {
          version,
          isActive: false,
        },
      });

      if (dto.isActive) {
        await tx.gatewayVersion.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        return tx.gatewayVersion.update({
          where: { id: created.id },
          data: { isActive: true },
        });
      }

      return created;
    });
  }

  async setActiveGatewayVersion(
    user: AppUser,
    dto: SetActiveGatewayVersionDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);

    const id = dto.id?.trim();
    const version = dto.version?.trim();
    if (!id && !version) {
      throw new BadRequestException('id or version is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.gatewayVersion.findUnique({
        where: id ? { id } : { version: version as string },
      });

      if (!target) {
        throw new NotFoundException('Gateway version not found');
      }

      await tx.gatewayVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.gatewayVersion.update({
        where: { id: target.id },
        data: { isActive: true },
      });
    });
  }
}
