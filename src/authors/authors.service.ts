import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAuthorDto } from "./dto/create-author.dto";
import { UpdateAuthorDto } from "./dto/update-author.dto";
import { QueryAuthorDto } from "./dto/query-author.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  async create(createAuthorDto: CreateAuthorDto) {
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
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: QueryAuthorDto) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AuthorWhereInput = query.search
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

  async findOne(id: string) {
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
      throw new NotFoundException(`Author not found`);
    }

    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
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
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Author not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if author has books
      const booksCount = await this.prisma.book.count({
        where: { authorId: id },
      });

      if (booksCount > 0) {
        throw new ConflictException(
          `Cannot delete author with ID ${id}. Author has ${booksCount} associated book(s). Delete the books first or use cascade delete.`
        );
      }

      await this.prisma.author.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Author not found`);
      }
      throw error;
    }
  }
}
