import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role, type User } from '@repo/database';
import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { SetUserPasswordDto } from './dto/set-user-password.dto.js';
import { UpdateNameDto } from './dto/update-name.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Permissions('user:read')
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Permissions('user:create')
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Permissions('user:read')
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    if (actor.role !== Role.ADMIN && actor.id !== id) {
      throw new ForbiddenException('You can only view your own account');
    }

    return this.usersService.findOne(id);
  }

  @Permissions('user:update')
  @Roles(Role.ADMIN)
  @Patch(':id/name')
  updateName(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNameDto) {
    return this.usersService.updateName(id, dto.name);
  }

  @Patch('me')
  updateOwnName(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNameDto,
  ) {
    return this.usersService.updateName(userId, dto.name);
  }

  @Permissions('user:update')
  @Roles(Role.ADMIN)
  @Patch(':id/password')
  async setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserPasswordDto,
  ): Promise<void> {
    await this.usersService.assertExists(id);
    await this.authService.setPassword(id, dto.password);
  }
}
