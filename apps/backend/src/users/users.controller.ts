import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

// All user management is admin-only (enforced by the global RolesGuard).
@ApiTags('users')
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List semua user (admin only)' })
  async findAll() {
    const users = await this.usersService.findAll();
    return { data: users, meta: { total: users.length } };
  }

  @Post()
  @ApiOperation({ summary: 'Buat user baru (admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? 'staff',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update nama / role / status user (admin only)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus user (admin only)' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() current: User,
  ): Promise<{ message: string }> {
    // Guard: an admin cannot delete their own account.
    if (current.id === id) {
      throw new ForbiddenException('Anda tidak dapat menghapus akun sendiri');
    }
    await this.usersService.remove(id);
    return { message: 'User berhasil dihapus' };
  }
}
