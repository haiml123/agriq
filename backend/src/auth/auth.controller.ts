import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AuthService, AuthResponse, Tokens } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login with email and password
   * POST /api/auth/login
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.login(req.user);
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

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
  getProfile(@CurrentUser() user) {
    return user;
  }

  /**
   * Verify if token is valid (useful for frontend)
   * GET /api/auth/verify
   */
  @Get('verify')
  verify(@CurrentUser() user): { valid: boolean; user: any } {
    return {
      valid: true,
      user,
    };
  }
}
