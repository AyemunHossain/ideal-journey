import { PrismaService } from "../prisma/prisma.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { QueryBookDto } from "./dto/query-book.dto";
import { Prisma } from "@prisma/client";
export declare class BooksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createBookDto: CreateBookDto): Promise<{
        author: {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            email: string | null;
            website: string | null;
        };
    } & {
        id: string;
        title: string;
        isbn: string;
        publishedDate: Date | null;
        genre: string | null;
        description: string | null;
        pageCount: number | null;
        language: string | null;
        publisher: string | null;
        price: Prisma.Decimal | null;
        currency: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
    }>;
    findAll(query: QueryBookDto): Promise<{
        data: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            title: string;
            isbn: string;
            publishedDate: Date | null;
            genre: string | null;
            description: string | null;
            pageCount: number | null;
            language: string | null;
            publisher: string | null;
            price: Prisma.Decimal | null;
            currency: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        author: {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            email: string | null;
            website: string | null;
        };
    } & {
        id: string;
        title: string;
        isbn: string;
        publishedDate: Date | null;
        genre: string | null;
        description: string | null;
        pageCount: number | null;
        language: string | null;
        publisher: string | null;
        price: Prisma.Decimal | null;
        currency: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
    }>;
    update(id: string, updateBookDto: UpdateBookDto): Promise<{
        author: {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            email: string | null;
            website: string | null;
        };
    } & {
        id: string;
        title: string;
        isbn: string;
        publishedDate: Date | null;
        genre: string | null;
        description: string | null;
        pageCount: number | null;
        language: string | null;
        publisher: string | null;
        price: Prisma.Decimal | null;
        currency: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
    }>;
    remove(id: string): Promise<void>;
}
