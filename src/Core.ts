import {Service} from "typedi";
import {YoutubeNotifier} from "./services/YoutubeNotifier";
import {SubscriptionManager} from "./services/SubscriptionManager";
import {Redis} from "./services/Redis";
import {Reddit} from "./services/Reddit";
import {NewReplacesTheOld} from "./models/NewReplacesTheOld";

@Service()
export class Core {

    constructor(
        // private readonly youtubeNotifier: YoutubeNotifier,
        // private readonly subscriptionManager: SubscriptionManager,
        // private readonly redis: Redis,
        // private readonly reddit: Reddit
        private readonly newReplacesTheOld: NewReplacesTheOld
    ) {
    }

    // Setup services
    async main() {
        await this.newReplacesTheOld.setup();
        // await this.reddit.setup();
        // await this.youtubeNotifier.setup();
        //
        // await this.redis.setup();
        // await this.subscriptionManager.setup();
        console.log("started")
    }
}
