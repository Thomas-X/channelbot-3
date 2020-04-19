import {Service} from "typedi";
import {IService} from "./interfaces/IService";
import {Env} from "./Env";
import snoowrap, {PrivateMessage, Comment} from "snoowrap";
import {getConnection, Repository} from "typeorm";
import {Channel} from "../models/Channel";
import {Redis} from "./Redis";
import {YoutubeNotifier} from "./YoutubeNotifier";

export enum Commands {
    list = "list",
    add = "add",
    remove = "remove",
}

type CommandValues = {
    subreddit: string,
    channel: string | undefined,
    channel_id: string | undefined,
}

@Service()
export class Reddit implements IService {
    client: snoowrap;
    private channelRepository: Repository<Channel>;

    constructor(
        private readonly env: Env,
        private readonly redis: Redis,
        private readonly youtubeNotifier: YoutubeNotifier,
    ) {
        const vars = this.env.get();
        this.client = new snoowrap({
            userAgent: vars.REDDIT_USER_AGENT,
            clientId: vars.REDDIT_CLIENT_ID,
            clientSecret: vars.REDDIT_CLIENT_SECRET,
            username: vars.REDDIT_USERNAME,
            password: vars.REDDIT_PASSWORD
        });
        this.channelRepository = getConnection()
            .getRepository(Channel);
    }

    addCommandParser = async (vals: CommandValues, message: PrivateMessage) => {
        // TODO check if channel_id is null, if yes fetch it from youtube API. (we have no need to store actual channel name)
        const exists = await this.channelRepository.findOne({
            where: {
                user: message.author.name,
                subreddit: vals.subreddit,
                channel_id: vals.channel_id
            }
        });
        if (!!exists) return "I'm sorry, but you've already added those parameters to my inner thoughts.";
        if (!vals.channel_id) return "My maker hasn't implemented this feature (channel->channel_id) yet.";

        let e = this.channelRepository.create();
        e.channel_id = String(vals.channel_id);
        e.subreddit = vals.subreddit;
        e.user = message.author.name;
        e = await e.save();

        await this.youtubeNotifier.notifier.subscribe(e.channel_id);
        // 432000 is lease from pubsubhubbub, 300 is 5 min of space
        await this.redis.set(e.id, String((Date.now() / 1000) + (432000 - 300)));

        return "Thank you for your message, I've processed it and you can expect me to start posting within a minute after a video has been uploaded to that channel. Max 5 min before everything is setup on my end, depending on server load."
    };

    removeCommandParser = async (vals: CommandValues, message: PrivateMessage) => {
        // TODO check if channel_id is null, if yes fetch it from youtube API. (we have no need to store actual channel name)
        const exists = await this.channelRepository.findOne({
            where: {
                user: message.author.name,
                subreddit: vals.subreddit,
                channel_id: vals.channel_id
            }
        });
        if (!exists || exists.user !== message.author.name) return "I'm sorry, but you either don't own this association or it does not exist.";
        if (!vals.channel_id) return "My maker hasn't implemented this feature (channel->channel_id) yet. Or at least, not correctly. Go bug him.";

        await this.youtubeNotifier.notifier.unsubscribe(exists.channel_id);
        await this.redis.del(exists.id);
        await exists.remove();
        return "I have successfully removed your association! I sure hope you keep using me though, I wouldn't want it otherwise!";
    };

    listCommandParser = async (vals: CommandValues, message: PrivateMessage) => {
        const exists = await this.channelRepository.find({
            where: {
                user: message.author.name,
                subreddit: vals.subreddit,
            }
        });
        if (!exists || exists.length === 0) return "I'm sorry, but you either don't own this association or it does not exist.";

        let str = "";

        const s = exists.sort((a, b) => {
            if (a.subreddit !== b.subreddit) return -1;
            if (b.subreddit !== a.subreddit) return 1;
            return 0;
        });

        for (const channel of s) {
            const a = `subreddit: \n**${channel.subreddit}**\nchannel_id:**${channel.channel_id}**\n\n`;
            if (str.length === 0) {
                str = a
            } else {
                str += a;
            }
        }
        // TODO max private message length is 10000 characters, we should ensure to split our message up if we exceed that.

        return str;
    };

    parser = async (body: string[][], message: PrivateMessage, cb: (vals: CommandValues, message: PrivateMessage) => Promise<string>): Promise<string> => {
        let vals: CommandValues = {
            channel: "",
            channel_id: "",
            subreddit: ""
        };
        let response = "";
        console.log(body);
        for (const e of body) {
            let [key, value] = e;
            console.log(key,value);
            if (key === "channel") {
                vals.channel = value;
            } else if (key === "channel_id") {
                vals.channel_id = value;
            } else if (key === "subreddit") {
                vals.subreddit = value;
            } else {
                response = `I could not parse that message, please refer to the documentation at https://reddit.com/r/channelbot for more info. \n Couldn't process at: ${key}:${value}`;
                break;
            }
        }
        console.log(vals);
        if (response.length > 0) return response;
        return cb(vals, message);
    };

    parseMessage = async (body: PrivateMessage, subject: Commands): Promise<string> => {
        let r: string;
        const p = body
            .body
            .split("\n")
            .map(x => {
                const [a, b] = x.split(":");
                if (!b) return null;
                return [a, b.trim()]
            })
            .filter(x => !!x) as unknown as string[][];
        switch (subject.toLowerCase()) {
            case Commands.add:
                r = await this.parser(p, body, this.addCommandParser);
                break;
            case Commands.list:
                r = await this.parser(p, body, this.listCommandParser);
                break;
            case Commands.remove:
                r = await this.parser(p, body, this.removeCommandParser);
                break;
            default:
                r = "I couldn't parse your message, I'm sorry. Did you misspell the subject by accident?";
        }
        return r;
    };

    // Check unread messages
    run = async () => {
        const messages = await this.client.getUnreadMessages();
        const responses = [];
        for (const message of messages) {
            // console.log(message);
            responses.push(await this.parseMessage(message, message.subject as Commands));
        }
        for (const response of responses) {
            console.log(response);
        }

    };

    async setup(): Promise<void> {
        setInterval(this.run, 10000);
    }

}
