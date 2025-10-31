import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { QueryBookDto } from "./dto/query-book.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    // Verify author exists
    const authorExists = await this.prisma.author.findUnique({
      where: { id: createBookDto.authorId },
    });

    if (!authorExists) {
      throw new BadRequestException(
        `Author with ID ${createBookDto.authorId} does not exist`
      );
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
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException(
          `Book with ISBN ${createBookDto.isbn} already exists`
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryBookDto) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

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

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
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
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }
      if (error.code === "P2002") {
        throw new ConflictException(`Book with this ISBN already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.book.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }
      throw error;
    }
  }
}
