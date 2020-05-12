import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";
import {OverrideBaseEntity} from "./OverrideBaseEntity";

// This structure could be a lot more normalized instead of how it is right now, but I really can't bother with the added complexity of that (not needed in this scope)
@Entity()
export class Post extends OverrideBaseEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    channel_id!: string;

    @Column()
    subreddit!: string;


    @Column()
    video_id!: string;

    @Column()
    submission_url!: string;

    // Always the same as channel_id in dataset, not needed
    // upload_playlist!: number;

    // Unused values from dataset
    // last_videos!: string[];
    // last_check!: number;
}
