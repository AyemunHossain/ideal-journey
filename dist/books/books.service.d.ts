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
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            id: string;
            email: string | null;
            website: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
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
        authorId: string;
    }>;
    findAll(query: QueryBookDto): Promise<{
        data: ({
            author: {
                firstName: string;
                lastName: string;
                id: string;
            };
        } & {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            id: string;
            email: string | null;
            website: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
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
        authorId: string;
    }>;
    update(id: string, updateBookDto: UpdateBookDto): Promise<{
        author: {
            firstName: string;
            lastName: string;
            bio: string | null;
            birthDate: Date | null;
            id: string;
            email: string | null;
            website: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
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
        authorId: string;
    }>;
    remove(id: string): Promise<void>;
}
