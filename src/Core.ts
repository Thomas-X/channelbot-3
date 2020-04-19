import {Service} from "typedi";
import {YoutubeNotifier} from "./services/YoutubeNotifier";
import {Database} from "./models/Database";
import {SubscriptionManager} from "./services/SubscriptionManager";
import {Redis} from "./services/Redis";
import {Reddit} from "./services/Reddit";

@Service()
export class Core {

    constructor(
        private readonly youtubeNotifier: YoutubeNotifier,
        private readonly database: Database,
        private readonly subscriptionManager: SubscriptionManager,
        private readonly redis: Redis,
        private readonly reddit: Reddit
    ) {
    }

    // Setup services
    async main() {
        await this.database.setup();
        await this.youtubeNotifier.setup();

        await this.redis.setup();
        await this.subscriptionManager.setup();

        await this.reddit.setup();
    }
}
