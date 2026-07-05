
import { CACHE_REDIS, RedisIoredisProvider } from '@/config/redis.config';
import { CacheVersionService } from '@/modules/cache-version/service/cache-version.service';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
const redis = {

}
describe('Cache Version', () => {
    let redis: Redis;
    let service: CacheVersionService;
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: ".env",
                }),
            ],
            providers: [
                RedisIoredisProvider,
                CacheVersionService,
            ],
        }).compile();

        redis = moduleRef.get(CACHE_REDIS);
        service = moduleRef.get(CacheVersionService)
    });

    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });


    it("should connect to real redis", async () => {
        await redis.set("test:key", "123");
        await redis.set("test:key:1", 33);

        const value = await redis.get("test:key");
        expect(value).toBe("123");
    });

    it("should bump cache version", async () => {
        const namespace = 'books';
        const query = "?list=1"
        const key = `${namespace}:${query}`
        const factoryV1 = jest.fn().mockResolvedValue([
            { id: 1, name: "Book A", price: 100 },
        ]);

        const factoryV2 = jest.fn().mockResolvedValue([
            { id: 1, name: "Book A", price: 120 },
        ]);

        const value1 = await service.withCache(key, 300, factoryV1);
        console.log(value1);
        await service.bumpVersion(key)

        const valueAfterBump = await service.get(key);
        console.log(valueAfterBump);

        const value2 = await service.withCache(key, 300, factoryV2);
        console.log(value2);

        expect(value1).toEqual([
            { id: 1, name: "Book A", price: 100 },
        ]);

        expect(valueAfterBump).toBeNull();

        expect(value2).toEqual([
            { id: 1, name: "Book A", price: 120 },
        ]);

        expect(value2).not.toEqual(value1);
        expect(factoryV1).toHaveBeenCalledTimes(1);
        expect(factoryV2).toHaveBeenCalledTimes(1);
    });
});
