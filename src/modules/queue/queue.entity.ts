import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { VideoSourceType } from '@modules/video/video.model';





export interface AddQueueItem {
  type: VideoSourceType;
  url: string;
}





@Entity({name: "queue"})
export class QueueItem
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: "source_type", type: "int", nullable: false })
  sourceType: number;

  @Column({name: "external_id", nullable: false })
  externalId: string;

  @Column({nullable: false })
  title: string;

  @Column({nullable: false })
  artist: string;

  @Column({type: "int", nullable: false })
  runtime: number;   // runtime in secs
}