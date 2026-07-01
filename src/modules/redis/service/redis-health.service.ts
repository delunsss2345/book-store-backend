import { CACHE_REDIS } from "@/config/redis.config"
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common"
import Redis from "ioredis"

@Injectable()
export class RedisHealthService implements OnModuleInit {
    private logger = new Logger(RedisHealthService.name)
    constructor(@Inject(CACHE_REDIS) private readonly redis: Redis) { }
    async onModuleInit() {
        try {
            await this.redis.ping()
            this.logger.log('Kết nối thành công')
        } catch (err) {
            throw new Error(`Không thể kết nối Redis: ${JSON.stringify(err)}`)
        }
    }
}