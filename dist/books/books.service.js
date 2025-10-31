"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BooksService = class BooksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBookDto) {
        const authorExists = await this.prisma.author.findUnique({
            where: { id: createBookDto.authorId },
        });
        if (!authorExists) {
            throw new common_1.BadRequestException(`Author with ID ${createBookDto.authorId} does not exist`);
        }
        try {
            const book = await this.prisma.book.create({
                data: {
                    ...createBookDto,
                    publishedDate: createBookDto.publishedDate
                        ? new Date(createBookDto.publishedDate)
                        : null,
                },
                include: {
                    author: true,
                },
            });
            return book;
        }
        catch (error) {
            if (error.code === "P2002") {
                throw new common_1.ConflictException(`Book with ISBN ${createBookDto.isbn} already exists`);
            }
            throw error;
        }
    }
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: "insensitive" } },
                { isbn: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.authorId) {
            where.authorId = query.authorId;
        }
        const [books, total] = await Promise.all([
            this.prisma.book.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.book.count({ where }),
        ]);
        return {
            data: books,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const book = await this.prisma.book.findUnique({
            where: { id },
            include: {
                author: true,
            },
        });
        if (!book) {
            throw new common_1.NotFoundException(`Book with ID ${id} not found`);
        }
        return book;
    }
    async update(id, updateBookDto) {
        try {
            const book = await this.prisma.book.update({
                where: { id },
                data: {
                    ...updateBookDto,
                    publishedDate: updateBookDto.publishedDate
                        ? new Date(updateBookDto.publishedDate)
                        : undefined,
                },
                include: {
                    author: true,
                },
            });
            return book;
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new common_1.NotFoundException(`Book with ID ${id} not found`);
            }
            if (error.code === "P2002") {
                throw new common_1.ConflictException(`Book with this ISBN already exists`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            await this.prisma.book.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new common_1.NotFoundException(`Book with ID ${id} not found`);
            }
            throw error;
        }
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BooksService);
//# sourceMappingURL=books.service.js.map