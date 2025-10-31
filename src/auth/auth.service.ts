import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { User, Role } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthService {
  private readonly maxLoginAttempts: number;
  private readonly lockTime: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.maxLoginAttempts = this.configService.get("MAX_LOGIN_ATTEMPTS", 5);
    this.lockTime = this.configService.get("LOCK_TIME", 15) * 60 * 1000; // Convert to milliseconds
  }

  async signup(signupDto: SignupDto): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(signupDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        password: hashedPassword,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        role: Role.USER,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Create audit log
    await this.createAuditLog("User", user.id, "SIGNUP", null, null);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async signin(
    signinDto: SigninDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: signinDto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new ForbiddenException(
        `Account is locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      user.password
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException("Invalid credentials");
    }

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token and last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
        lastLoginAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog("User", user.id, "SIGNIN", ipAddress, userAgent);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException("Access Denied");
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException("Access Denied");
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.createAuditLog("User", userId, "LOGOUT", null, null);

    return { message: "Successfully logged out" };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from current password"
      );
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and invalidate all refresh tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });

    await this.createAuditLog("User", userId, "PASSWORD_CHANGE", null, null);

    return { message: "Password changed successfully. Please login again." };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.sanitizeUser(user);
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("User not found or inactive");
    }

    return user;
  }

  // Private helper methods

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get("BCRYPT_ROUNDS", 12);
    return bcrypt.hash(password, parseInt(rounds));
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_SECRET"),
        expiresIn: this.configService.get("JWT_EXPIRATION", "15m"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION", "7d"),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const failedAttempts = (user?.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: failedAttempts };

    if (failedAttempts >= this.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + this.lockTime);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async resetFailedLoginAttempts(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, refreshToken, passwordResetToken, ...sanitized } = user;
    return sanitized;
  }

  private async createAuditLog(
    entityType: string,
    entityId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        userId: entityId,
        ipAddress,
        userAgent,
        changes: null,
      },
    });
  }
}
