import { BooksService } from "./books.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { QueryBookDto } from "./dto/query-book.dto";
export declare class BooksController {
    private readonly booksService;
    constructor(booksService: BooksService);
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
            price: import("@prisma/client/runtime/library").Decimal | null;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
        currency: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
    }>;
    remove(id: string): Promise<void>;
}
