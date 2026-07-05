import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class PaymentConfiguration {
    @IsString()
    @IsNotEmpty()
    BANK_ID!: string;

    @IsString()
    @IsNotEmpty()
    ACCOUNT_NO!: string;

    @IsString()
    @IsNotEmpty()
    TEMPLATE_OR!: string;

    @IsString()
    @IsNotEmpty()
    NAME_RECEIVER!: string;

    constructor(data: Partial<PaymentConfiguration> = {}) {
        this.BANK_ID = data.BANK_ID ?? process.env['BANK_ID'] ?? '';
        this.ACCOUNT_NO = (data.ACCOUNT_NO ?? process.env['ACCOUNT_NO'] ?? '');

        this.NAME_RECEIVER = (data.NAME_RECEIVER ?? process.env['NAME_RECEIVER'] ?? '');
        this.TEMPLATE_OR = data.TEMPLATE_OR ?? process.env['TEMPLATE_OR'] ?? '';

        const errors = validateSync(this);
        if (errors.length) {
            console.log(errors);
            throw new Error('Invalid Payment config');
        }
    }
}
