import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
