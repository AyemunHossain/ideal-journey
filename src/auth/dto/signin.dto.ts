import { IsEmail, IsString, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class SigninDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
