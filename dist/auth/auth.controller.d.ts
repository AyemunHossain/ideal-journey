import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { Request } from "express";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<{
        user: Partial<import(".prisma/client").User>;
        accessToken: string;
        refreshToken: string;
    }>;
    signin(signinDto: SigninDto, req: Request): Promise<{
        user: Partial<import(".prisma/client").User>;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(user: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<Partial<{
        firstName: string;
        lastName: string;
        id: string;
        email: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        password: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        isEmailVerified: boolean;
        emailVerifiedAt: Date | null;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        passwordResetToken: string | null;
        passwordResetExpires: Date | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
    }>>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getStatus(user: any): Promise<{
        isAuthenticated: boolean;
        user: {
            userId: any;
            email: any;
            role: any;
        };
    }>;
}
