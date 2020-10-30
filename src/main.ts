import { createConnection } from 'typeorm';
import 'reflect-metadata';
import { Container } from 'typedi';
import { Core } from './Core';
import { EnvReturnTypecasted } from './services/Env';

require("dotenv").config();

(async () => {
    // quick hack because dependency issues
    const vars = process.env as unknown as EnvReturnTypecasted;
    const conn = await createConnection({
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
        logging: true
    });

    let core = Container.get(Core);
    await core.main();
})();
