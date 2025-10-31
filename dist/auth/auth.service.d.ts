import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly maxLoginAttempts;
    private readonly lockTime;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    signup(signupDto: SignupDto): Promise<{
        user: Partial<User>;
        accessToken: string;
        refreshToken: string;
    }>;
    signin(signinDto: SigninDto, ipAddress?: string, userAgent?: string): Promise<{
        user: Partial<User>;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<Partial<User>>;
    validateUser(userId: string): Promise<User>;
    private hashPassword;
    private generateTokens;
    private updateRefreshToken;
    private handleFailedLogin;
    private resetFailedLoginAttempts;
    private sanitizeUser;
    private createAuditLog;
}
