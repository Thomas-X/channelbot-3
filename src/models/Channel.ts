import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";
import {OverrideBaseEntity} from "./OverrideBaseEntity";

@Entity()
export class Channel extends OverrideBaseEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    channel_id!: string;

    @Column()
    subreddit!: string;

    @Column()
    user!: string;


    // Always the same as channel_id in dataset, not needed
    // upload_playlist!: number;

    // Unused values from dataset
    // last_videos!: string[];
    // last_check!: number;
}
