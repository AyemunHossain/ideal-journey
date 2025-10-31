import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreateBookDto } from "./create-book.dto";

export class UpdateBookDto extends PartialType(
  OmitType(CreateBookDto, ["authorId"] as const)
) {}
