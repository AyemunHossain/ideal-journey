import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Patch,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { Public } from "./decorator/public.decorator";
import { CurrentUser } from "./decorator/current-user.decorator";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Public()
  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async signin(@Body() signinDto: SigninDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.get("user-agent");
    return this.authService.signin(signinDto, ipAddress, userAgent);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@CurrentUser() user: any) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser("userId") userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@CurrentUser("userId") userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("change-password")
  async changePassword(
    @CurrentUser("userId") userId: string,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("status")
  async getStatus(@CurrentUser() user: any) {
    return {
      isAuthenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
