import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query('organizationId') organizationId?: string) {
    return this.usersService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
