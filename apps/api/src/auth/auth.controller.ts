import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { ClerkWebhookEvent } from './auth.types';

@ApiTags('auth')
@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('webhook')
  handleWebhook(@Req() request: Request, @Body() body: ClerkWebhookEvent) {
    return this.authService.handleClerkWebhook(request, body);
  }

  @ApiBearerAuth()
  @Get('me')
  getProfile(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user, dto);
  }
}
