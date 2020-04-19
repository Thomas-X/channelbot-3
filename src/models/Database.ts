import {IService} from "../services/interfaces/IService";
import "./Channel";
import {Service} from "typedi";
import {createConnection} from "typeorm";
import {Env} from "../services/Env";

@Service()
export class Database implements IService {

    constructor(
        private readonly env: Env
    ) {
    }

    async setup(): Promise<void> {
        const vars = this.env.get();
        await createConnection({
            type: "mysql",
            host: vars.MYSQL_HOST,
            port: vars.MYSQL_PORT,
            username: vars.MYSQL_USERNAME,
            password: vars.MYSQL_PASSWORD,
            database: vars.MYSQL_DATABASE_NAME,
            entities: [
                "build/models/**/*.js"
            ],
            synchronize: true,
            // logging: true
        });
    }
}
