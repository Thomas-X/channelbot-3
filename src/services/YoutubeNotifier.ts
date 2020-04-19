import {IService} from "./interfaces/IService";
import {Service} from "typedi";
import YouTubeNotifier, {SubscribeEvent, UnsubscribeEvent, VideoEvent} from "youtube-notification";
import {Env} from "./Env";

@Service({global: true})
export class YoutubeNotifier implements IService {
    notifier: YouTubeNotifier;
    onNotified: Array<(data: VideoEvent) => void> = [];
    onUnsubscribe: Array<(data: UnsubscribeEvent) => void> = [];
    onSubscribe: Array<(data: SubscribeEvent) => void> = [];

    constructor(
        private readonly env: Env
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
            for (const cb of this.onNotified) {
                cb(data);
            }
        });

        this.notifier.on("subscribe", data => {
            console.log(data);
            for (const cb of this.onSubscribe) {
                cb(data);
            }
        });

        this.notifier.on("unsubscribe", data => {
            for (const cb of this.onUnsubscribe) {
                cb(data);
            }
        });

        this.onSubscribe.push(data => {
            console.log("we should probably do something with this onSubscribe!: ", data);
        });
        this.onUnsubscribe.push(data => {
            console.log("we should probably do something with this onUnsubscribe!: ", data);
        });
        this.onNotified.push(data => {
            console.log("we should probably do something with this onNotified!: ", data);
        });

    }
}
