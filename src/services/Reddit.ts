import {Service} from "typedi";
import {IService} from "./interfaces/IService";
import {Env} from "./Env";
import snoowrap, {PrivateMessage, Comment} from "snoowrap";

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

    constructor(
        private readonly env: Env
    ) {
        const vars = this.env.get();
        this.client = new snoowrap({
            userAgent: vars.REDDIT_USER_AGENT,
            clientId: vars.REDDIT_CLIENT_ID,
            clientSecret: vars.REDDIT_CLIENT_SECRET,
            username: vars.REDDIT_USERNAME,
            password: vars.REDDIT_PASSWORD
        });
    }

    addCommandParser = (vals: CommandValues) => {
        // TODO implement
        return "hello from addCommandParser"
    };

    removeCommandParser = (vals: CommandValues) => {
        // TODO implement
        return "hello from removeCommandParser"
    };

    listCommandParser = (vals: CommandValues) => {
        // TODO implement
        return "hello from listCommandParser"
    };

    parser = async (body: string[][], cb: (vals: CommandValues) => string) => {
        let vals: CommandValues = {
            channel: "",
            channel_id: "",
            subreddit: ""
        };
        let response = "";
        for (const e of body) {
            let [key, value] = e;
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
        if (response.length > 0) return response;
        return cb(vals);
    };

    parseMessage = async (body: string, subject: Commands): Promise<string> => {
        let r: string;
        const p = body
            .split("\n")
            .map(x => {
                const [a, b] = x.split(":");
                return [a, b.trim()]
            });
        switch (subject.toLowerCase()) {
            case Commands.add:
                r = await this.parser(p, this.addCommandParser);
                break;
            case Commands.list:
                r = await this.parser(p, this.listCommandParser);
                break;
            case Commands.remove:
                r = await this.parser(p, this.removeCommandParser);
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
            responses.push(this.parseMessage(message.body, message.subject as Commands));
        }
        for (const response of responses) {
            console.log(response);
        }

    };

    async setup(): Promise<void> {
        setInterval(this.run, 10000);
    }

}
