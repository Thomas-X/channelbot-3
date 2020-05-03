import {Inject, Service} from "typedi";
import {IService} from "./interfaces/IService";
import {Env} from "./Env";
import snoowrap, {PrivateMessage, Comment} from "snoowrap";
import {getConnection, Repository} from "typeorm";
import {Channel} from "../models/Channel";
import {Redis} from "./Redis";
import {YoutubeNotifier} from "./YoutubeNotifier";
import {VideoEvent} from "youtube-notification";
import axios from "axios";
import {filterAsync} from 'lodasync'
import {Post} from "../models/Post";

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
    // solves an issue where IF not all messages are processed before the next iter loop
    // the bot would read it's own messages and end up in a race condition, causing it to spam "You've already added X to me" to the user.
    private waitForLastIter: boolean = false;

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
        // we really don't wanna be throttled >:)
        this.client.config({
            continueAfterRatelimitError: true,
            requestDelay: 1050
        });
        this.channelRepository = getConnection()
            .getRepository(Channel);
    }

    addCommandParser = async (vals: CommandValues, message: PrivateMessage) => {
        const exists = await this.channelRepository.findOne({
            where: {
                user: message.author.name,
                subreddit: vals.subreddit,
                channel_id: vals.channel_id
            }
        });
        if (!!exists) return "I'm sorry, but you've already added those parameters to my inner thoughts.";

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

    getChannelIdFromChannelName = async (channelName: string): Promise<string | undefined> => {
        const vars = this.env.get();
        const res = (await axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${vars.YOUTUBE_API_KEY}&forUsername=${encodeURI(channelName)}&part=id`
        )).data as unknown as {
            items: { id: string }[] | []
        };
        console.log(res, `https://www.googleapis.com/youtube/v3/channels?key=${vars.YOUTUBE_API_KEY}&forUsername=${encodeURI(channelName)}&part=id`);
        if (!res.items) throw new Error("Something went horribly wrong when talking to the Youtube API. " + JSON.stringify(res));
        const channel = res.items.length > 0 ? res.items[0] : undefined;
        if (!channel) return "Could not convert channel parameter to channel_id, check out the wiki and my subreddit for help. \n\nYou can also retry your request but with the channel_id parameter instead if you're certain there's been a mistake from my end. Or use the googler if you don't know how to convert channel names to channelIDs, but only as a last resort.";
        return channel.id
    };

    removeCommandParser = async (vals: CommandValues, message: PrivateMessage) => {
        const exists = await this.channelRepository.findOne({
            where: {
                subreddit: vals.subreddit,
                channel_id: vals.channel_id
            }
        });

        // perms
        if (!exists) {
            return "I'm sorry, but that association does not not exist.";
        } else {
            const mods = (await this.client.getSubreddit(vals.subreddit)
                .getModerators())
                .filter(x => x.name === message.author.name);
            if (mods.length === 0) {
                return "You are not a mod of this subreddit you are trying to remove, how silly of you!"
            }
        }

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
        if (!exists || exists.length === 0) {
            return "I'm sorry, but that association does not not exist.";
        }

        let str = "";

        const s = await filterAsync(async (channel: Channel) => {
            return (await this.client.getSubreddit(channel.subreddit).getModerators())
                .filter(mod => mod.name === channel.user)
                .length > 0;
        }, exists.sort((a, b) => {
            if (a.subreddit !== b.subreddit) return -1;
            if (b.subreddit !== a.subreddit) return 1;
            return 0;
        }));
        if (s.length === 0) return "You are not a moderator in any of the subreddits I have, weird!";

        for (const channel of s) {
            const a = `subreddit: \n\n**${channel.subreddit}**\n\nchannel_id:**${channel.channel_id}**\n\n\n\n`;
            if (str.length === 0) {
                str = a
            } else {
                str += a;
            }
        }
        // TODO max private message length is 10000 characters, we should ensure to split our message up if we exceed that.

        return str;
    };

    parser = async (body: string[][], message: PrivateMessage, cb: (vals: CommandValues, message: PrivateMessage) => Promise<string>, command: Commands): Promise<string> => {
        let vals: CommandValues = {
            channel: undefined,
            channel_id: undefined,
            subreddit: ""
        };
        let response = "";
        console.log(body);
        for (const e of body) {
            let [key, value] = e;
            console.log(key, value);
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

        if (vals.channel_id === undefined && (
            command === Commands.add ||
            command === Commands.remove
        )) {
            if (vals.channel === undefined) return "Parameters channel_id AND channel were both empty, not continueing. Check the subreddit (/r/channelbot) and wiki for help, you probably had a mistake in your formatting of your message to me."
            vals.channel_id = await this.getChannelIdFromChannelName(vals.channel);
        }
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
        const cmd = subject.toLowerCase() as Commands;
        switch (cmd) {
            case Commands.add:
                r = await this.parser(p, body, this.addCommandParser, cmd);
                break;
            case Commands.list:
                r = await this.parser(p, body, this.listCommandParser, cmd);
                break;
            case Commands.remove:
                r = await this.parser(p, body, this.removeCommandParser, cmd);
                break;
            default:
                r = "I couldn't parse your message, I'm sorry. Did you misspell the subject by accident?";
        }
        return r;
    };

    postVideo = async (channel: Channel, data: VideoEvent) => {
        const postRepository = await getConnection().getRepository(Post);
        const existingPost = postRepository
            .findOne({
                where: {
                    channel_id: channel.channel_id,
                    subreddit: channel.subreddit,
                    video_id: data.video.id
                }
            });

        if (!!existingPost) return;

        this.client.getSubreddit(channel.subreddit)
            // Docs say more values are allowed than what is in typings (submitlink opts)
            .submitLink(<any>{
                url: data.video.link,
                title: data.video.title,
                sendReplies: false
            })
            .then(x => {
                const post = new Post();
                post.video_id = data.video.id;
                post.subreddit = channel.subreddit;
                post.channel_id = channel.channel_id;
                post.save();

                console.log(x)
            })
            .catch(err => console.log(err));
    };

    // Check unread messages
    run = async () => {
        this.waitForLastIter = true;
        const messages = await this.client.getUnreadMessages();
        for (const message of messages) {
            if (!message.markAsRead || typeof message.markAsRead !== "function") {
                console.log("skipping message which can not be set to read, attempting to delete from inbox");
                if (message.deleteFromInbox && typeof message.deleteFromInbox === "function") {
                    message.deleteFromInbox()
                        .then(x => console.log("deleted message from inbox"))
                        .catch(x => console.log(x));
                }
                continue;
            }
            // mark as read incase it's a message we really can't process, and we don't want to get stuck on that message every cycle.
            await message.markAsRead()
                .then(async (x) => {
                    console.log("read ", x);
                    message.reply(
                        await this.parseMessage(message, message.subject as Commands)
                    )
                        .then(x => console.log("reply ", x))
                        .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
        }

    };

    async setup(): Promise<void> {
        this.youtubeNotifier.onNotified.push((d) => {
            console.log("on notified", d);
            getConnection()
                .getRepository(Channel)
                .find({
                    where: {
                        channel_id: d.channel.id
                    }
                })
                .then(async (x) => {
                    for (const channel of x) {
                        await this.postVideo(channel, d);
                    }
                })
                .catch(err => console.log(err));
        });
        setInterval(() => {
            if (!this.waitForLastIter) {
                this.run()
                    .then(x => this.waitForLastIter = false)
                    .catch(x => {
                        this.waitForLastIter = false;
                        console.log(x);
                    })
            }
        }, 20000);
    }

}
