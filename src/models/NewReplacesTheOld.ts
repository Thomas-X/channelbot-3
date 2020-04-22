import {Service} from "typedi";
import {Env} from "../services/Env";
import {IService} from "../services/interfaces/IService";
import snoowrap from "snoowrap";
import fs from "fs";
import path from "path";
import {getConnection} from "typeorm";
import {Channel} from "./Channel";

type OldChannel = {
    channel: string;
    channel_id: string;
    subreddit: string;
    user: string;
    register_date: number;
    upload_playlist: string;
    last_videos: string[];
    last_check: number;
}

@Service()
export class NewReplacesTheOld implements IService{
    private client: snoowrap;
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
        this.client.config({
            continueAfterRatelimitError: true,
            requestDelay: 300
        })
    }

    async migrate() {
        const old = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "channels.json"), {encoding: "utf8"})) as OldChannel[];
        const promises = [];
        let i =0;
        for (const channel of old) {
            promises.push(this.client.composeMessage({
                to: "channelbot",
                subject: "add",
                text: `channel_id:${channel.channel_id}\nsubreddit:${channel.subreddit}`
            }));
            i++;
            console.log(i);
            await new Promise(resolve => setTimeout(() => resolve(), 1200))
        }
        await Promise.all(promises);
    }

    async migrateUserPermissions() {
        const old = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "channels.json"), {encoding: "utf8"})) as OldChannel[];
        const c = getConnection().getRepository(Channel);
        for (const channel of old) {
            const a = await c.find({
                where: {
                    subreddit: channel.subreddit,
                    channel_id: channel.channel_id
                }
            });
            for (const existingChannel of a) {
                existingChannel.user = channel.user;
                await existingChannel.save();
            }
        }
    }

    async setup(): Promise<void> {
        await this.migrateUserPermissions()
    }
}
