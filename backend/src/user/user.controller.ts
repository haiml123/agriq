import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, ListUsersQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators';
import { role_type } from '@prisma/client';
import * as userType from '../types/user.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {
    console.log('user controller');
  }

  @Roles(role_type.SUPER_ADMIN, role_type.ADMIN)
  @Get()
  findAll(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    console.log('users query:', query);
    return this.userService.findAll(user, query);
  }

  @Roles(role_type.SUPER_ADMIN, role_type.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: userType.AppUser) {
    return this.userService.create(user, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.userService.update(user, id, dto);
  }
}
