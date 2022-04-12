import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';





@Entity({name: "queue_order"})
export class QueueOrder
{
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({name: "order_obj", nullable: false })
  orderObj: string;
}