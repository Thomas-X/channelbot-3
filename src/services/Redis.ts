import {Service} from "typedi";
import {IService} from "./interfaces/IService";
import {promisify} from "util";
import redis, {RedisClient} from "redis";
import {Env} from "./Env";

@Service()
export class Redis implements IService {
    client: RedisClient;
    set: (key: string, value: string) => Promise<any>;
    get: (key: string) => Promise<any>;
    keys: (pattern: string) => Promise<any>;
    del: (key: string) => Promise<any>;

    constructor(
        private readonly env: Env
    ) {
        const vars = this.env.get();
        this.client = redis.createClient({
            host: vars.REDIS_DB_HOST,
            port: vars.REDIS_DB_PORT,
            db: vars.REDIS_DB_NAME,
        });
        this.set = promisify(this.client.set).bind(this.client) as unknown as (key: string, value: string) => Promise<any>;
        this.get = promisify(this.client.get).bind(this.client) as unknown as (key: string) => Promise<any>;
        this.keys = promisify(this.client.keys).bind(this.client) as unknown as (pattern: string) => Promise<any>;
        this.del = promisify(this.client.del).bind(this.client) as unknown as (key: string) => Promise<any>;
    }

    async setup(): Promise<void> {

    }

}
