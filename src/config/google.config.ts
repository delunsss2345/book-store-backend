import { IsString } from 'class-validator';
export class GoogleConfiguration {
    @IsString()
    GOOGLE_API_KEY_BOOK: string;
    constructor() {
        this.GOOGLE_API_KEY_BOOK = process.env['GOOGLE_API_KEY_BOOK'] ? (process.env['GOOGLE_API_KEY_BOOK']) : '';
    }
}