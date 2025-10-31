import { Module } from "@nestjs/common";
import { AuthorsModule } from "./authors/authors.module";
import { BooksModule } from "./books/books.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuthorsModule,
    BooksModule,
  ],
})
export class AppModule {}
