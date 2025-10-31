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
exports.AuthorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthorsService = class AuthorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAuthorDto) {
        try {
            const author = await this.prisma.author.create({
                data: {
                    ...createAuthorDto,
                    birthDate: createAuthorDto.birthDate
                        ? new Date(createAuthorDto.birthDate)
                        : null,
                },
            });
            return author;
        }
        catch (error) {
            throw error;
        }
    }
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;
        const where = query.search
            ? {
                OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                ],
            }
            : {};
        const [authors, total] = await Promise.all([
            this.prisma.author.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.author.count({ where }),
        ]);
        return {
            data: authors,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const author = await this.prisma.author.findUnique({
            where: { id },
            include: {
                books: {
                    select: {
                        id: true,
                        title: true,
                        isbn: true,
                        genre: true,
                    },
                },
            },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID ${id} not found`);
        }
        return author;
    }
    async update(id, updateAuthorDto) {
        try {
            const author = await this.prisma.author.update({
                where: { id },
                data: {
                    ...updateAuthorDto,
                    birthDate: updateAuthorDto.birthDate
                        ? new Date(updateAuthorDto.birthDate)
                        : undefined,
                },
            });
            return author;
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new common_1.NotFoundException(`Author with ID ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            const booksCount = await this.prisma.book.count({
                where: { authorId: id },
            });
            if (booksCount > 0) {
                throw new common_1.ConflictException(`Cannot delete author with ID ${id}. Author has ${booksCount} associated book(s). Delete the books first or use cascade delete.`);
            }
            await this.prisma.author.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                throw new common_1.NotFoundException(`Author with ID ${id} not found`);
            }
            throw error;
        }
    }
};
exports.AuthorsService = AuthorsService;
exports.AuthorsService = AuthorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthorsService);
//# sourceMappingURL=authors.service.js.map