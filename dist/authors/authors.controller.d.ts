import { AuthorsService } from "./authors.service";
import { CreateAuthorDto } from "./dto/create-author.dto";
import { UpdateAuthorDto } from "./dto/update-author.dto";
import { QueryAuthorDto } from "./dto/query-author.dto";
export declare class AuthorsController {
    private readonly authorsService;
    constructor(authorsService: AuthorsService);
    create(createAuthorDto: CreateAuthorDto): Promise<{
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
    }>;
    findAll(query: QueryAuthorDto): Promise<{
        data: {
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
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        books: {
            id: string;
            title: string;
            isbn: string;
            genre: string;
        }[];
    } & {
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
    }>;
    update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<{
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
    }>;
    remove(id: string): Promise<void>;
}
