import { CreateBookDto } from "./create-book.dto";
declare const UpdateBookDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateBookDto, "authorId">>>;
export declare class UpdateBookDto extends UpdateBookDto_base {
}
export {};
