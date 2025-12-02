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
import { CreateUserDto, ListUsersQueryDto, RoleType } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators';
import type { UserWithRoles } from './user.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {
    console.log('user controller');
  }

  @Roles(RoleType.SUPER_ADMIN, RoleType.ORG_ADMIN)
  @Get()
  findAll(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() user: UserWithRoles,
  ) {
    console.log('users query:', query);
    return this.userService.findAll(user, query);
  }

  @Roles(RoleType.SUPER_ADMIN, RoleType.ORG_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: UserWithRoles) {
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
    @CurrentUser() user: UserWithRoles,
  ) {
    return this.userService.update(user, id, dto);
  }
}
