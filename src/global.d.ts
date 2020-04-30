declare module "lodasync" {
    export function filterAsync(func: any, array: any[]): any[]
}

declare module "youtube-notification" {

    export interface SubscribeEvent {
        type: "subscribe";
        channel: string;
        lease_seconds: string;
    }

    export interface VideoEvent {
        video: {
            id: string;
            title: string;
            link: string
        }
        channel: {
            id: string;
            name: string;
            link: string;
        }
        published: Date,
        updated: Date,
    }

    export interface UnsubscribeEvent {
        type: "unsubscribe";
        channel: string;
    }

    export type OnEmit = SubscribeEvent | UnsubscribeEvent | VideoEvent

    export default class {
        constructor(opts: {
            hubCallback: string,
            port: number,
            secret: string,
            path: string
        });

        setup();

        on(eventName: "unsubscribe", cb: (data: UnsubscribeEvent) => void)
        on(eventName: "subscribe", cb: (data: SubscribeEvent) => void)
        on(eventName: "notified", cb: (data: VideoEvent) => void)

        subscribe(channelId: string | string[])

        unsubscribe(channelId: string | string[])
    }
}
