import { IsBoolean, IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

export class NodemailerConfiguration {
    @IsString()
    @IsNotEmpty()
    MAIL_HOST!: string;

    @IsNumber()
    MAIL_PORT!: number;

    @IsBoolean()
    MAIL_SECURE!: boolean;

    @IsString()
    @IsNotEmpty()
    MAIL_USER!: string;

    @IsString()
    @IsNotEmpty()
    MAIL_PASS!: string;

    constructor(data: Partial<NodemailerConfiguration> = {}) {
        this.MAIL_HOST = data.MAIL_HOST ?? process.env['MAIL_HOST'] ?? '';
        this.MAIL_PORT = Number(data.MAIL_PORT ?? process.env['MAIL_PORT'] ?? 0);

        const secureRaw = data.MAIL_SECURE ?? process.env['MAIL_SECURE'] ?? false;
        this.MAIL_SECURE =
            typeof secureRaw === 'boolean' ? secureRaw : String(secureRaw).toLowerCase() === 'true';
        this.MAIL_USER = data.MAIL_USER ?? process.env['MAIL_USER'] ?? '';
        this.MAIL_PASS = data.MAIL_PASS ?? process.env['MAIL_PASS'] ?? '';

        const errors = validateSync(this);
        if (errors.length) {
            console.log(errors);
            throw new Error('Invalid Nodemailer config (MAIL_*)');
        }
    }
    get transport() {
        return {
            host: this.MAIL_HOST,
            port: this.MAIL_PORT,
            secure: this.MAIL_SECURE,
            auth: {
                user: this.MAIL_USER,
                pass: this.MAIL_PASS,
            },
        };
    }
}
