require("dotenv").config();
import "reflect-metadata"
import YouTubeNotifier, {SubscribeEvent, OnEmit, VideoEvent} from "youtube-notification";
import {Container} from "typedi";
import {Core} from "./Core";


(async () => {
    let core = Container.get(Core);
    await core.main();
})();
