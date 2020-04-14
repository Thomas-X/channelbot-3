import {Service} from "typedi";
import {IService} from "./interfaces/IService";
import {promisify} from "util";
import redis, {RedisClient} from "redis";
import {Env} from "./Env";

@Service()
export class Redis implements IService {
    client: RedisClient;
    hget: (key: string, field: string) => Promise<any>;
    hset: (hashTableKey: string, fieldName: string, fieldValue: string) => Promise<any>;

    constructor(
        private readonly env: Env
    ) {
        const vars = this.env.get();
        this.client = redis.createClient({
            host: vars.REDIS_DB_HOST,
            port: vars.REDIS_DB_PORT,
            db: vars.REDIS_DB_NAME,
        });
        this.hset = promisify(this.client.hset).bind(this.client) as unknown as (hashTableKey: string, fieldName: string, fieldValue: string) => Promise<any>;
        this.hget = promisify(this.client.hget).bind(this.client) as unknown as (key: string, field: string) => Promise<any>;
    }

    setup(): void {

    }

}
