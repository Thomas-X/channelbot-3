import {IService} from "./interfaces/IService";
import {Service} from "typedi";
import {Redis} from "./Redis";
import {YoutubeNotifier} from "./YoutubeNotifier";
import {getConnection} from "typeorm";
import {Channel} from "../models/Channel";

@Service()
export class SubscriptionManager implements IService {
    isRunning: boolean = false;

    constructor(
        private readonly redis: Redis,
        private readonly youtubeNotifier: YoutubeNotifier
    ) {
    }

    // This method checks every X seconds if the subscriptions with the pubsubhubbub API have to be refreshed
    run = async () => {
        this.isRunning = true;
        const keys = await this.redis.keys("*");
        const now = Date.now() / 1000;
        const channelRepository = getConnection().getRepository(Channel);
        console.log("keys from redis: ", keys);
        for (const key of keys) {
            const time = Number(await this.redis.get(key));

            console.log("Time till resubscribe in s: ", time - now, time - now > 0);

            // if the difference is higher than 0, it means it is in the past so we should resubscribe!
            if (time - now < 0) {
                // wait a second between requests to not get throttled
                await new Promise(resolve => setTimeout(resolve, 450));
                console.log("re-subscribing", time, now, time - now);
                const channel = await channelRepository
                    .findOne({
                        where: {
                            id: key
                        }
                    });
                if (!channel || !channel.channel_id) throw new Error("channel without channel_id that needs to be resubscribed, crashing..");
                this.youtubeNotifier.notifier.subscribe(channel.channel_id);
                await this.redis.set(key, String((Date.now() / 1000) + (432000 - 300)))
            }
        }
        this.isRunning = false;
    };

    async setup(): Promise<void> {
        setInterval(async () => {
            if (!this.isRunning) {
                await this.run();
            }
        }, 10000);
    }
}
