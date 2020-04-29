import {IService} from "./interfaces/IService";
import {Service} from "typedi";
import {Redis} from "./Redis";
import {YoutubeNotifier} from "./YoutubeNotifier";
import {getConnection} from "typeorm";
import {Channel} from "../models/Channel";

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
            // if the difference is higher than 0, it means it is in the past so we should resubscribe!
            if (time - now > 0) {
                console.log("re-subscribing", time, now, time - now);
                subscribes.push(new Promise((resolve) => {
                    getConnection()
                        .getRepository(Channel)
                        .findOne({
                            where: {
                                id: key
                            }
                        })
                        .then(channel => {
                            if (!channel || !channel.channel_id) throw new Error("channel without channel_id that needs to be resubscribed, crashing..");
                            this.youtubeNotifier.notifier.subscribe(channel.channel_id);
                            this.redis.set(key, String((Date.now() / 1000) + (432000 - 300)))
                                .then(x => {
                                    resolve();
                                })
                                .catch(err => console.log(err));
                        })
                        .catch(err => console.log(err));
                }));
            }
        }
        await Promise.all(subscribes);
    };

    async setup(): Promise<void> {
        setInterval(this.run, 10000);
    }
}
