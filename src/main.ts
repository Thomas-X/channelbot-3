import {createConnection} from "typeorm";

require("dotenv").config();
import "reflect-metadata"
import YouTubeNotifier, {SubscribeEvent, OnEmit, VideoEvent} from "youtube-notification";
import {Container} from "typedi";
import {Core} from "./Core";
import {EnvOpts, EnvReturnTypecasted} from "./services/Env";


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
        // logging: true
    });
    
    let core = Container.get(Core);
    await core.main();
})();
