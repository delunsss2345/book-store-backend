import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

export class JwtConfiguration {
    @IsString()
    @IsNotEmpty()
    ACCESS_TOKEN_SECRET: string;

    @IsNumber()
    ACCESS_TOKEN_TIME: number;

    @IsNumber()
    REFRESH_TOKEN_TIME: number;

    constructor(data: Partial<JwtConfiguration> = {}) {
        this.ACCESS_TOKEN_SECRET = data.ACCESS_TOKEN_SECRET ?? process.env['ACCESS_TOKEN_SECRET'] ?? '';
        this.ACCESS_TOKEN_TIME = data?.ACCESS_TOKEN_TIME ?? Number(process.env['ACCESS_TOKEN_TIME']);
        this.REFRESH_TOKEN_TIME = data?.REFRESH_TOKEN_TIME ?? Number(process.env['REFRESH_TOKEN_TIME']);

        const errors = validateSync(this);
        if (errors.length >= 1) {
            console.log(errors);
        }
    }
}

export const JwtProvider = JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
        const accessSecret = config.get<string>('JWT_CONFIG.ACCESS_TOKEN_SECRET');
        const accessTime = Number(config.get('JWT_CONFIG.ACCESS_TOKEN_TIME'));

        if (!accessSecret || !Number.isFinite(accessTime)) {
            throw new Error('Invalid JWT config (ACCESS_TOKEN_SECRET/ACCESS_TOKEN_TIME)');
        }

        return {
            secret: accessSecret,
            signOptions: {
                expiresIn: accessTime,
            },
        };
    },
});
