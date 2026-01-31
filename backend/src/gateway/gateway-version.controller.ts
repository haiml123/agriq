import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import type { AppUser } from '../types/user.type';
import {
  CreateGatewayVersionDto,
  SetActiveGatewayVersionDto,
} from './dto';
import { GatewayVersionService } from './gateway-version.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { File as MulterFile } from 'multer';
import { Readable } from 'stream';

@Controller('gateway-versions')
@UseGuards(JwtAuthGuard)
export class GatewayVersionController {
  constructor(private readonly gatewayVersionService: GatewayVersionService) {}

  @Get()
  listGatewayVersions(@CurrentUser() user: AppUser) {
    return this.gatewayVersionService.listGatewayVersions(user);
  }

  @Get('bundles')
  @Public()
  listGatewayBundles() {
    return this.gatewayVersionService.listBundleManifests();
  }

  @Get('manifest/latest')
  @Public()
  getLatestManifest() {
    return this.gatewayVersionService.getLatestManifest();
  }

  @Get('bundles/active/file')
  @Public()
  @Header('Content-Type', 'application/octet-stream')
  async getActiveBundleFile() {
    const { filename, stream } =
      await this.gatewayVersionService.getActiveBundleFile();
    return new StreamableFile(Readable.from(stream as any), {
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('bundles/:version/file')
  @Public()
  @Header('Content-Type', 'application/octet-stream')
  async getBundleFile(@Param('version') version: string) {
    const { filename, stream } =
      await this.gatewayVersionService.getBundleFile(version);
    return new StreamableFile(Readable.from(stream as any), {
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('active')
  getActiveGatewayVersion(@CurrentUser() user: AppUser) {
    return this.gatewayVersionService.getActiveGatewayVersion(user);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadGatewayBundle(
    @CurrentUser() user: AppUser,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.gatewayVersionService.uploadBundle(user, file);
  }

  @Post()
  createGatewayVersion(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateGatewayVersionDto,
  ) {
    return this.gatewayVersionService.createGatewayVersion(user, dto);
  }

  @Patch('active')
  setActiveGatewayVersion(
    @CurrentUser() user: AppUser,
    @Body() dto: SetActiveGatewayVersionDto,
  ) {
    return this.gatewayVersionService.setActiveGatewayVersion(user, dto);
  }
}
