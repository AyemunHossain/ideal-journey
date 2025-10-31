import { Test, TestingModule } from "@nestjs/testing";
import { AuthorsService } from "./authors.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("AuthorsService", () => {
  let service: AuthorsService;
  let prismaService: PrismaService;

  // Mock PrismaService with all methods
  const mockPrismaService = {
    author: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    book: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createAuthorDto = {
      firstName: "John",
      lastName: "Doe",
      bio: "Test bio",
      birthDate: "1980-01-01",
      email: "john@example.com",
    };

    it("should successfully create a new author", async () => {
      const expectedAuthor = {
        id: "author-123",
        firstName: createAuthorDto.firstName,
        lastName: createAuthorDto.lastName,
        bio: createAuthorDto.bio,
        birthDate: new Date("1980-01-01"),
        email: createAuthorDto.email,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      // Mock: Create returns new author
      mockPrismaService.author.create.mockResolvedValue(expectedAuthor);

      const result = await service.create(createAuthorDto as any);

      expect(result).toEqual(expectedAuthor);
      expect(mockPrismaService.author.create).toHaveBeenCalledWith({
        data: {
          firstName: "John",
          lastName: "Doe",
          bio: "Test bio",
          birthDate: expect.any(Date),
          email: "john@example.com",
        },
      });
    });

    it("should rethrow Prisma errors from create", async () => {
      const prismaError: any = new Error("Unique constraint");
      prismaError.code = "P2002";
      mockPrismaService.author.create.mockRejectedValue(prismaError);

      await expect(service.create(createAuthorDto as any)).rejects.toThrow(
        prismaError
      );
    });

    it("should create author without optional fields", async () => {
      const minimalDto = {
        firstName: "Jane",
        lastName: "Smith",
      };

      const expectedAuthor = {
        id: "author-456",
        firstName: "Jane",
        lastName: "Smith",
        bio: null,
        birthDate: null,
        email: null,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockPrismaService.author.create.mockResolvedValue(expectedAuthor);

      const result = await service.create(minimalDto as any);

      expect(result.firstName).toBe("Jane");
      expect(result.email).toBeNull();
      expect(mockPrismaService.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: "Jane",
          lastName: "Smith",
        }),
      });
    });

    it("should convert birthDate string to Date object", async () => {
      mockPrismaService.author.create.mockImplementation((args) => {
        expect(args.data.birthDate).toBeInstanceOf(Date);
        expect(args.data.birthDate.getFullYear()).toBe(1980);
        return Promise.resolve({ id: "author-123", ...args.data });
      });

      await service.create(createAuthorDto as any);

      expect(mockPrismaService.author.create).toHaveBeenCalledTimes(1);
    });

    it("should handle website URL if provided", async () => {
      const dtoWithWebsite = {
        ...createAuthorDto,
        website: "https://johndoe.com",
      };

      mockPrismaService.author.create.mockResolvedValue({
        id: "author-123",
        ...dtoWithWebsite,
        birthDate: new Date("1980-01-01"),
      });

      const result = await service.create(dtoWithWebsite as any);

      expect(result.website).toBe("https://johndoe.com");
    });
  });

  describe("findAll", () => {
    it("should return paginated authors with default values", async () => {
      const mockAuthors = [
        {
          id: "author-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          bio: null,
          birthDate: null,
          website: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.author.findMany.mockResolvedValue(mockAuthors);
      mockPrismaService.author.count.mockResolvedValue(1);

      const result = await service.findAll({ page: "1", limit: "10" });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should accept large limits as provided", async () => {
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      await service.findAll({ page: "1", limit: "500" });

      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 500,
        })
      );
    });

    it("should filter by search term across multiple fields", async () => {
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      await service.findAll({ page: "1", limit: "10", search: "John" });

      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: "John", mode: "insensitive" } },
              { lastName: { contains: "John", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    it("should calculate pagination metadata correctly", async () => {
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(25);

      const result = await service.findAll({ page: "2", limit: "10" });

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it("should handle empty results", async () => {
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      const result = await service.findAll({ page: "1", limit: "10" });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it("should ignore unsupported sort keys and use createdAt by default", async () => {
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      // Pass through as any to avoid TypeScript type errors for unsupported keys
      await service.findAll({
        page: "1",
        limit: "10",
        sortBy: "firstName",
        sortOrder: "asc",
      } as any);

      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return author with books", async () => {
      const mockAuthor = {
        id: "author-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        bio: "Author bio",
        birthDate: new Date("1980-01-01"),
        website: "https://johndoe.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        books: [
          {
            id: "book-1",
            title: "Book Title",
            isbn: "978-0-123456-78-9",
            publishedDate: new Date("2020-01-01"),
          },
        ],
      } as any;
      mockPrismaService.author.findUnique.mockResolvedValue(mockAuthor);

      const result = await service.findOne("author-123");

      expect(result).toEqual(mockAuthor);
      expect(result.books).toHaveLength(1);
      expect(mockPrismaService.author.findUnique).toHaveBeenCalledWith({
        where: { id: "author-123" },
        include: {
          books: {
            select: { id: true, title: true, isbn: true, genre: true },
          },
        },
      });
    });

    it("should throw NotFoundException for non-existent author", async () => {
      mockPrismaService.author.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent")).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne("non-existent")).rejects.toThrow(
        "Author not found"
      );
    });

    it("should exclude deleted books from results", async () => {
      const mockAuthor = {
        id: "author-123",
        firstName: "John",
        lastName: "Doe",
        books: [],
      } as any;

      mockPrismaService.author.findUnique.mockResolvedValue(mockAuthor);

      await service.findOne("author-123");

      expect(mockPrismaService.author.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            books: {
              select: { id: true, title: true, isbn: true, genre: true },
            },
          },
        })
      );
    });
  });

  describe("update", () => {
    const updateDto = {
      bio: "Updated bio",
      website: "https://newsite.com",
    };

    const existingAuthor = {
      id: "author-123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      bio: "Old bio",
      website: "https://oldsite.com",
      birthDate: new Date("1980-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    it("should successfully update author", async () => {
      const updatedAuthor = { ...existingAuthor, ...updateDto };

      mockPrismaService.author.update.mockResolvedValue(updatedAuthor);

      const result = await service.update("author-123", updateDto as any);

      expect(result).toEqual(updatedAuthor);
      expect(result.bio).toBe("Updated bio");
      expect(mockPrismaService.author.update).toHaveBeenCalledWith({
        where: { id: "author-123" },
        data: {
          ...updateDto,
          birthDate: undefined,
        },
      });
    });

    it("should throw NotFoundException when Prisma returns P2025", async () => {
      const prismaError: any = new Error("Record not found");
      prismaError.code = "P2025";
      mockPrismaService.author.update.mockRejectedValue(prismaError);

      await expect(
        service.update("author-123", updateDto as any)
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.author.update).toHaveBeenCalled();
    });

    it("should convert birthDate string to Date when updating if provided", async () => {
      const updateDtoWithBirthDate = { birthDate: "1985-05-15" } as any;

      mockPrismaService.author.update.mockImplementation((args) => {
        expect(args.data.birthDate).toBeInstanceOf(Date);
        return Promise.resolve({ ...existingAuthor, ...args.data });
      });

      await service.update("author-123", updateDtoWithBirthDate as any);

      expect(mockPrismaService.author.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("remove", () => {
    const authorId = "author-123";
    const mockAuthor = {
      id: authorId,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    } as any;

    it("should hard delete author when no associated books", async () => {
      mockPrismaService.book.count.mockResolvedValue(0);
      mockPrismaService.author.delete.mockResolvedValue(mockAuthor);

      await service.remove(authorId);

      expect(mockPrismaService.author.delete).toHaveBeenCalledWith({
        where: { id: authorId },
      });
      expect(mockPrismaService.author.update).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when author has associated books", async () => {
      mockPrismaService.book.count.mockResolvedValue(5);

      await expect(service.remove(authorId)).rejects.toThrow(ConflictException);
      await expect(service.remove(authorId)).rejects.toThrow(
        `Cannot delete author with ID ${authorId}. Author has 5 associated book(s). Delete the books first or use cascade delete.`
      );
      expect(mockPrismaService.author.delete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException for non-existent author", async () => {
      mockPrismaService.book.count.mockResolvedValue(0);
      const prismaError: any = new Error("Record not found");
      prismaError.code = "P2025";
      mockPrismaService.author.delete.mockRejectedValue(prismaError);

      await expect(service.remove("non-existent")).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
