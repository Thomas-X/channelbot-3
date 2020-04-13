import {Service} from "typedi";
import {YoutubeNotifier} from "./services/YoutubeNotifier";
import "./services/YoutubeNotifier"
import "./services/Env"

@Service()
export class Core {

    constructor(
        private readonly youtubeNotifier: YoutubeNotifier
    ) {
    }

    // Setup services
    async main() {
        await this.youtubeNotifier.setup();
    }

}
