import {IService} from "./interfaces/IService";
import {Inject, Service} from "typedi";
import YouTubeNotifier, {SubscribeEvent, UnsubscribeEvent, VideoEvent} from "youtube-notification";
import {Env} from "./Env";
import {getConnection} from "typeorm";
import {Channel} from "../models/Channel";
import {Reddit} from "./Reddit";
import {add, differenceInSeconds} from "date-fns";

@Service({global: true})
export class YoutubeNotifier implements IService {
    notifier: YouTubeNotifier;
    onNotified: Array<(data: VideoEvent) => void> = [];
    onUnsubscribe: Array<(data: UnsubscribeEvent) => void> = [];
    onSubscribe: Array<(data: SubscribeEvent) => void> = [];

    constructor(
        private readonly env: Env,
    ) {
        const vars = this.env.get();
        this.notifier = new YouTubeNotifier({
            hubCallback: vars.HUB_CALLBACK,
            port: vars.PORT,
            secret: vars.HUB_SECRET,
            path: vars.HUB_PATH
        });
        this.notifier.setup();

    }

    async setup(): Promise<void> {

        await this.registerEvents();
    }

    async registerEvents() {
        this.notifier.on("notified", data => {
            console.log("internal onnotified", data);
            if (differenceInSeconds(new Date(data.published), new Date()) <= 30) {
                for (const cb of this.onNotified) {
                    cb(data);
                }
            } else {
                console.log("activated the guard for edited/removed videos")
            }
        });

        this.notifier.on("subscribe", data => {
            console.log("subscribe", data)
            for (const cb of this.onSubscribe) {
                cb(data);
            }
        });

        this.notifier.on("unsubscribe", data => {
            console.log("unsubscribe", data)
            for (const cb of this.onUnsubscribe) {
                cb(data);
            }
        });

    }
}
