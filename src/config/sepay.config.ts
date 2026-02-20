import { Logger } from '@nestjs/common';
import { IsString, validateSync } from 'class-validator';
export class SepayConfiguration {
    @IsString()
    MERCHANT_ID: string;

    @IsString()
    MERCHANT_SECRET: string;
    constructor() {
        this.MERCHANT_ID = process.env['MERCHANT_ID'] ?? '';
        this.MERCHANT_SECRET = process.env['MERCHANT_SECRET'] ?? '';
    }
    validate() {
        const errors = validateSync(this);
        if (errors.length > 0) {
            const _errors = errors.map((error) => {
                return error.children;
            });
            Logger.log(_errors);
            throw new Error('Configuration missing value !');
        }
    }
}