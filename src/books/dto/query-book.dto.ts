import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  IsNumberString,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class QueryBookDto {
  @IsOptional()
  @IsString()
  @IsOptional()
  @IsNumberString()
  page?: string = "1";

  @IsOptional()
  @IsOptional()
  @IsNumberString()
  limit?: string = "10";

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;
}
