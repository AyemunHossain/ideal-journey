import { IsOptional, IsString, IsNumberString } from "class-validator";
import { Transform } from "class-transformer";

export class QueryAuthorDto {
  @IsOptional()
  @IsNumberString()
  page?: string = "1";

  @IsOptional()
  @IsNumberString()
  limit?: string = "10";

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}
