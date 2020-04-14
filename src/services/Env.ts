import {Service} from "typedi";

export interface EnvOpts {
    // pubhubsubbub stuff
    HUB_CALLBACK: string,
    HUB_SECRET: string,
    HUB_PATH: string

    // mysql
    MYSQL_HOST: string,
    MYSQL_PORT: string,
    MYSQL_USERNAME: string,
    MYSQL_PASSWORD: string,
    MYSQL_DATABASE_NAME: string,

    // redis
    REDIS_DB_HOST: string,
    REDIS_DB_PORT: string,
    REDIS_DB_NAME: string,

    // youtube-notification underlying server running on this port
    PORT: string | number,
}

type EnvReturnTypecasted =
    Omit<Omit<Omit<Omit<EnvOpts, 'PORT'>
        , 'MYSQL_PORT'>, 'REDIS_DB_NAME'>, 'REDIS_DB_PORT'> & {
    PORT: number,
    MYSQL_PORT: number,
    REDIS_DB_NAME: number,
    REDIS_DB_PORT: number
}

@Service()
export class Env {
    get(): EnvReturnTypecasted {
        const {
            HUB_CALLBACK,
            PORT,
            HUB_SECRET,
            HUB_PATH,
            MYSQL_DATABASE_NAME,
            MYSQL_HOST,
            MYSQL_PASSWORD,
            MYSQL_PORT,
            MYSQL_USERNAME,
            REDIS_DB_HOST,
            REDIS_DB_PORT,
            REDIS_DB_NAME
        } = process.env as unknown as EnvOpts;
        return {
            HUB_CALLBACK,
            HUB_PATH,
            HUB_SECRET,
            PORT: Number(PORT) as number,
            MYSQL_DATABASE_NAME,
            MYSQL_HOST,
            MYSQL_PASSWORD,
            MYSQL_PORT: Number(MYSQL_PORT) as number,
            MYSQL_USERNAME,
            REDIS_DB_HOST,
            REDIS_DB_PORT: Number(REDIS_DB_PORT) as number,
            REDIS_DB_NAME: Number(REDIS_DB_NAME) as number
        }
    }
}
