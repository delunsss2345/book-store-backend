import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { IsNotEmpty, IsNumber, IsString, validateSync } from 'class-validator';

export class RateLimitConfiguration {
    @IsNumber()
    @IsNotEmpty()
    RATE_LIMIT_LIMIT!: number;

    @IsString()
    @IsNotEmpty()
    RATE_LIMIT_TTL!: number;


    constructor(data: Partial<RateLimitConfiguration> = {}) {
        this.RATE_LIMIT_LIMIT = data.RATE_LIMIT_LIMIT ?? Number(process.env['RATE_LIMIT_LIMIT']);
        this.RATE_LIMIT_TTL = data.RATE_LIMIT_TTL ?? Number(process.env['RATE_LIMIT_TTL']);

        const errors = validateSync(this);
        if (errors.length) {
            console.log(errors);
        }
    }
}



export const RateLimitProvider = ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
        const limitRaw = Number(
            config.get<number | string>('RATE_LIMIT_LIMIT') ?? 120,
        );
        const ttlRaw = Number(
            config.get<number | string>('RATE_LIMIT_TTL') ?? 60000,
        );

        const limit =
            Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 120;
        const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 60000;


        return [
            {
                limit,
                ttl,
            },
        ];
    },
});
