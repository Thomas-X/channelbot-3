import {IService} from "./interfaces/IService";
import {Service} from "typedi";
import {Redis} from "./Redis";
import {YoutubeNotifier} from "./YoutubeNotifier";

@Service()
export class SubscriptionManager implements IService {

    constructor(
        private readonly redis: Redis,
        private readonly youtubeNotifier: YoutubeNotifier
    ) {
    }

    // This method checks every X seconds if the subscriptions with the pubsubhubbub API have to be refreshed
    run = async () => {
        const keys = await this.redis.keys("*");
        const now = Date.now() / 1000;
        const subscribes = [];
        for (const key of keys) {
            const time = Number(await this.redis.get(key));
            if (time - now < 10000) {
                console.log("re-subscribing", time, now, time-now);
                subscribes.push(new Promise((resolve) => {
                    this.youtubeNotifier.notifier.subscribe(key);
                    resolve();
                }));
            }
        }
        await Promise.all(subscribes);
    };

    async setup(): Promise<void> {
        setInterval(this.run, 10000);
    }
}
