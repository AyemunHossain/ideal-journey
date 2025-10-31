import { BooksService } from "./books.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { QueryBookDto } from "./dto/query-book.dto";
export declare class BooksController {
    private readonly booksService;
    constructor(booksService: BooksService);
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
            price: import("@prisma/client/runtime/library").Decimal | null;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
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
        price: import("@prisma/client/runtime/library").Decimal | null;
        currency: string | null;
        authorId: string;
    }>;
    remove(id: string): Promise<void>;
}
