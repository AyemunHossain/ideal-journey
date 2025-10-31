"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class ValidationPipe extends common_1.ValidationPipe {
    constructor() {
        super({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: false,
            transformOptions: { enableImplicitConversion: true },
        });
    }
}
exports.ValidationPipe = ValidationPipe;
//# sourceMappingURL=validation.pipe.js.map