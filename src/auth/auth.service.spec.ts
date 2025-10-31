import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";

describe("AuthService", () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        JWT_SECRET: "test-secret",
        JWT_REFRESH_SECRET: "test-refresh-secret",
        JWT_EXPIRATION: "15m",
        JWT_REFRESH_EXPIRATION: "7d",
        BCRYPT_ROUNDS: "10",
        MAX_LOGIN_ATTEMPTS: 5,
        LOCK_TIME: 15,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    const signupDto = {
      email: "test@example.com",
      password: "StrongP@ssw0rd123",
      firstName: "John",
      lastName: "Doe",
    };

    it("should successfully create a new user", async () => {
      const hashedPassword = await bcrypt.hash(signupDto.password, 10);
      const mockUser = {
        id: "user-123",
        email: signupDto.email,
        password: hashedPassword,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        role: Role.USER,
        isActive: true,
        isEmailVerified: false,
        emailVerifiedAt: null,
        lastLoginAt: null,
        refreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce("access-token-123")
        .mockResolvedValueOnce("refresh-token-456");
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.signup(signupDto);

      expect(result.user.email).toBe(signupDto.email);
      expect(result.user.password).toBeUndefined();
      expect(result.accessToken).toBe("access-token-123");
      expect(result.refreshToken).toBe("refresh-token-456");
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SIGNUP",
            entityType: "User",
          }),
        })
      );
    });

    it("should throw ConflictException if email already exists", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: signupDto.email,
      });

      await expect(service.signup(signupDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it("should hash password before storing", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation((args) => {
        expect(args.data.password).not.toBe(signupDto.password);
        expect(args.data.password.length).toBeGreaterThan(50);
        return Promise.resolve({ id: "user-123", ...args.data });
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue("token");
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.signup(signupDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("signin", () => {
    const signinDto = {
      email: "test@example.com",
      password: "StrongP@ssw0rd123",
    };

    let mockUser;

    beforeEach(async () => {
      mockUser = {
        id: "user-123",
        email: signinDto.email,
        password: await bcrypt.hash(signinDto.password, 10),
        role: Role.USER,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        firstName: "John",
        lastName: "Doe",
      };
    });

    it("should successfully sign in with valid credentials", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.signin(signinDto, "127.0.0.1", "test-agent");

      expect(result.user.email).toBe(signinDto.email);
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signin(signinDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.signin(signinDto)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw UnauthorizedException for invalid password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});

      const wrongPasswordDto = { ...signinDto, password: "WrongPassword123!" };

      await expect(service.signin(wrongPasswordDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            failedLoginAttempts: 1,
          }),
        })
      );
    });

    it("should lock account after max failed attempts", async () => {
      const userWithFailedAttempts = {
        ...mockUser,
        password: await bcrypt.hash("different-password", 10),
        failedLoginAttempts: 4,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithFailedAttempts
      );
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(service.signin(signinDto)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it("should reject login for locked account", async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      await expect(service.signin(signinDto)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.signin(signinDto)).rejects.toThrow(
        /Account is locked due to too many failed login attempts/
      );
    });

    it("should throw ForbiddenException for inactive account", async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.signin(signinDto)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.signin(signinDto)).rejects.toThrow(
        "Account is deactivated"
      );
    });

    it("should create audit log with IP and user agent", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue("token");
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.signin(signinDto, "192.168.1.1", "Mozilla/5.0");

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SIGNIN",
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0",
          }),
        })
      );
    });
  });

  describe("refreshTokens", () => {
    it("should generate new tokens with valid refresh token", async () => {
      const userId = "user-123";
      const refreshToken = "valid-refresh-token";
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: "test@example.com",
        role: Role.USER,
        refreshToken: hashedRefreshToken,
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce("new-access-token")
        .mockResolvedValueOnce("new-refresh-token");

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);
    });

    it("should throw ForbiddenException for invalid refresh token", async () => {
      const hashedRefreshToken = await bcrypt.hash("different-token", 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-123",
        refreshToken: hashedRefreshToken,
      });

      await expect(
        service.refreshTokens("user-123", "invalid-token")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException for user without refresh token", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-123",
        refreshToken: null,
      });

      await expect(service.refreshTokens("user-123", "token")).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("logout", () => {
    it("should clear refresh token and create audit log", async () => {
      const userId = "user-123";

      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.logout(userId);

      expect(result.message).toBe("Successfully logged out");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LOGOUT",
          }),
        })
      );
    });
  });

  describe("changePassword", () => {
    const userId = "user-123";
    const currentPassword = "OldP@ssw0rd";
    const newPassword = "NewP@ssw0rd123";

    it("should successfully change password", async () => {
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        password: hashedPassword,
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      expect(result.message).toContain("Password changed successfully");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            refreshToken: null,
          }),
        })
      );
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "PASSWORD_CHANGE",
          }),
        })
      );
    });

    it("should throw UnauthorizedException for incorrect current password", async () => {
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        password: hashedPassword,
      });

      await expect(
        service.changePassword(userId, "WrongPassword", newPassword)
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw BadRequestException if new password equals current password", async () => {
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        password: hashedPassword,
      });

      await expect(
        service.changePassword(userId, currentPassword, currentPassword)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getProfile", () => {
    it("should return sanitized user profile", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        refreshToken: "refresh-token",
        passwordResetToken: "reset-token",
        firstName: "John",
        lastName: "Doe",
        role: Role.USER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile("user-123");

      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(result.passwordResetToken).toBeUndefined();
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("user-123")).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("validateUser", () => {
    it("should return user for valid active user", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        isActive: true,
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser("user-123");

      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException for inactive user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-123",
        isActive: false,
        deletedAt: null,
      });

      await expect(service.validateUser("user-123")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for deleted user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-123",
        isActive: true,
        deletedAt: new Date(),
      });

      await expect(service.validateUser("user-123")).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser("user-123")).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
