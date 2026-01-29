import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  StreamableFile,
  UploadedFile,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import * as userType from '../types/user.type';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  AssignGatewayDto,
  CreateGatewayDto,
  BatchGatewayPayloadDto,
  RegisterGatewayDto,
  UpdateGatewayDto,
} from './dto';
import type { File as MulterFile } from 'multer';
import { Readable } from 'stream';

@Controller('gateways')
@UseGuards(JwtAuthGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  listGateways(
    @CurrentUser() user: userType.AppUser,
    @Query('cellId') cellId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('unpaired') unpaired?: string,
  ) {
    return this.gatewayService.listGateways(user, {
      cellId,
      organizationId,
      unpaired: unpaired === 'true',
    });
  }

  @Get('manifest/latest')
  @Public()
  getLatestManifest() {
    return this.gatewayService.getLatestVersionManifest();
  }

  @Get('versions')
  @Public()
  listVersions() {
    return this.gatewayService.listVersions();
  }

  @Get('versions/:version/file')
  @Public()
  @Header('Content-Type', 'application/octet-stream')
  async getVersionFile(@Param('version') version: string) {
    const { filename, stream } =
      await this.gatewayService.getVersionFile(version);
    return new StreamableFile(Readable.from(stream as any), {
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':id')
  findGatewayById(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.findGatewayById(user, id);
  }

  @Post()
  createGateway(
    @Body() dto: CreateGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.createGateway(user, dto);
  }

  @Patch(':id')
  updateGateway(
    @Param('id') id: string,
    @Body() dto: UpdateGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.updateGateway(user, id, dto);
  }

  @Delete(':id')
  deleteGateway(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.deleteGateway(user, id);
  }

  @Post('register')
  registerGateway(
    @Body() dto: RegisterGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.registerGateway(user, dto);
  }

  @Post(':id/assign')
  assignGateway(
    @Param('id') id: string,
    @Body() dto: AssignGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.assignGatewayToCell(user, id, dto);
  }

  @Post(':id/unpair')
  unpairGateway(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.unpairGateway(user, id);
  }

  @Post(':id/readings')
  @Public()
  ingestGatewayPayload(
    @Param('id') id: string,
    @Body() dto: BatchGatewayPayloadDto,
  ) {
    return this.gatewayService.ingestGatewayPayloadFromDevice(id, dto);
  }

  @Post('upload-version')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  uploadLatestVersion(
    @CurrentUser() user: userType.AppUser,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.gatewayService.uploadLatestVersion(user, file);
  }
}
