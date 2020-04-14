import {BaseEntity, Column, Entity, PrimaryColumn} from "typeorm";
import {OverrideBaseEntity} from "./OverrideBaseEntity";

@Entity()
export class Channel extends OverrideBaseEntity {
    @PrimaryColumn()
    id!: string;

    @Column()
    channel!: string;

    @Column()
    channel_id!: string;

    @Column()
    subreddit!: string;

    @Column()
    user!: string;

    @Column()
    register_date!: number;

    // Don't do overly complicated things with checking if we missed videos that
    // were published when we were offline like the fatal mistake last time.

    @Column("timestamp")
    lease_expiration!: Date;



    // Always the same as channel_id in dataset, not needed
    // upload_playlist!: number;

    // Unused values from dataset
    // last_videos!: string[];
    // last_check!: number;
}
