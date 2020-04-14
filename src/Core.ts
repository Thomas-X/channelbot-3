import {Service} from "typedi";
import {YoutubeNotifier} from "./services/YoutubeNotifier";
import {Database} from "./models/Database";
import {SubscriptionManager} from "./services/SubscriptionManager";
import {Redis} from "./services/Redis";

@Service()
export class Core {

    constructor(
        private readonly youtubeNotifier: YoutubeNotifier,
        private readonly database: Database,
        private readonly subscriptionManager: SubscriptionManager,
        private readonly redis: Redis
    ) {
    }

    // Setup services
    async main() {
        await this.database.setup();
        await this.youtubeNotifier.setup();

        await this.redis.setup();
        await this.subscriptionManager.setup();
    }

}
