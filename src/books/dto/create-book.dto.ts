// ...existing code...
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsISBN,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsISBN() // accepts ISBN-10 or ISBN-13 (with or without hyphens)
  @Transform(({ value }) => value?.replace(/[-\s]/g, "").trim()) // normalize before validation/storage
  isbn: string;

  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  genre?: string;

  @IsUUID()
  @IsNotEmpty()
  authorId: string;
}
