import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register user baru (role default: staff)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // The LocalAuthGuard validates credentials and opens the session. The DTO is
  // declared so validation + Swagger pick up the body shape.
  @ApiOperation({ summary: 'Login & buat session' })
  login(@CurrentUser() user: User, @Body() _dto: LoginDto) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout & hapus session' })
  logout(@Req() req: Request): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
      req.logout((logoutErr) => {
        if (logoutErr) return reject(logoutErr);
        req.session.destroy((destroyErr) => {
          if (destroyErr) return reject(destroyErr);
          resolve({ message: 'Logged out successfully' });
        });
      });
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user dari session' })
  me(@CurrentUser() user: User): User {
    return user;
  }
}
