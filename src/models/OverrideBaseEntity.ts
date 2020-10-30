import { BaseEntity, BeforeInsert, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import uuid from 'uuid/v4';

export abstract class OverrideBaseEntity extends BaseEntity {
    abstract id: string;

    @BeforeInsert()
    beforeInsert() {
        this.id = uuid();
    }

    @CreateDateColumn({type: "timestamp"})
    createdAt!: Date;

    @UpdateDateColumn({type: "timestamp"})
    updatedAt!: Date;
}
