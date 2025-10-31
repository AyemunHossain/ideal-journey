"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.maxLoginAttempts = this.configService.get("MAX_LOGIN_ATTEMPTS", 5);
        this.lockTime = this.configService.get("LOCK_TIME", 15) * 60 * 1000;
    }
    async signup(signupDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: signupDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException("User with this email already exists");
        }
        const hashedPassword = await this.hashPassword(signupDto.password);
        const user = await this.prisma.user.create({
            data: {
                email: signupDto.email,
                password: hashedPassword,
                firstName: signupDto.firstName,
                lastName: signupDto.lastName,
                role: client_1.Role.USER,
            },
        });
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        await this.createAuditLog("User", user.id, "SIGNUP", null, null);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async signin(signinDto, ipAddress, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { email: signinDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new common_1.ForbiddenException(`Account is locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`);
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException("Account is deactivated");
        }
        const isPasswordValid = await bcrypt.compare(signinDto.password, user.password);
        if (!isPasswordValid) {
            await this.handleFailedLogin(user.id);
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        await this.resetFailedLoginAttempts(user.id);
        const tokens = await this.generateTokens(user);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
                lastLoginAt: new Date(),
            },
        });
        await this.createAuditLog("User", user.id, "SIGNIN", ipAddress, userAgent);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.refreshToken) {
            throw new common_1.ForbiddenException("Access Denied");
        }
        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!refreshTokenMatches) {
            throw new common_1.ForbiddenException("Access Denied");
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
        await this.createAuditLog("User", userId, "LOGOUT", null, null);
        return { message: "Successfully logged out" };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Current password is incorrect");
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new common_1.BadRequestException("New password must be different from current password");
        }
        const hashedPassword = await this.hashPassword(newPassword);
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
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        return this.sanitizeUser(user);
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive || user.deletedAt) {
            throw new common_1.UnauthorizedException("User not found or inactive");
        }
        return user;
    }
    async hashPassword(password) {
        const rounds = this.configService.get("BCRYPT_ROUNDS", 12);
        return bcrypt.hash(password, parseInt(rounds));
    }
    async generateTokens(user) {
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
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
    async handleFailedLogin(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        const failedAttempts = (user?.failedLoginAttempts || 0) + 1;
        const updateData = { failedLoginAttempts: failedAttempts };
        if (failedAttempts >= this.maxLoginAttempts) {
            updateData.lockedUntil = new Date(Date.now() + this.lockTime);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    }
    async resetFailedLoginAttempts(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
    }
    sanitizeUser(user) {
        const { password, refreshToken, passwordResetToken, ...sanitized } = user;
        return sanitized;
    }
    async createAuditLog(entityType, entityId, action, ipAddress, userAgent) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map