import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthResponse, AuthService, Tokens } from './auth.service';
import { LocalAuthGuard } from './guards';
import { CurrentUser, Public } from './decorators';
import { AppUser } from '../types/user.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    console.log('auth controller');
  }

  /**
   * Login with email and password
   * POST /api/auth/login
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: AppUser): Promise<AuthResponse> {
    console.log('login user', user);
    return this.authService.login(user);
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  // @Public()
  // @Post('register')
  // @HttpCode(HttpStatus.CREATED)
  // async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
  //    return this.authService.register(registerDto);
  // }

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<Tokens> {
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * Logout (invalidate refresh token)
   * POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices (invalidate all refresh tokens)
   * POST /api/auth/logout-all
   */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  @Get('me')
  getProfile(@CurrentUser() user: { id: string; email: string }) {
    return user;
  }

  /**
   * Verify if token is valid (useful for frontend)
   * GET /api/auth/verify
   */
  @Get('verify')
  verify(@CurrentUser() user: { id: string; email: string }): {
    valid: boolean;
    user: { id: string; email: string };
  } {
    return {
      valid: true,
      user,
    };
  }
}
