import { Connection, Not, Repository } from 'typeorm';
import * as path from "path";
const fs = require('fs');
import { Error } from '@modules/error-handling/error';
import { AddQueueItem, QueueItem } from './queue.entity';
import { QueueOrder } from './queue_order.entity';
import * as YoutubeService from '@modules/youtube/youtube.service';
import { VideoSourceType } from '@modules/video/video.model';
import { downloadFile } from '../../utils/file-downloader';
import { ROOT_API_URL, QUEUE_THUMBNAILS_DIR, YT_THUMBNAILS_ASSETS_URL } from '@env';





export class QueueService {
  private queueRepository: Repository<QueueItem>;
  private queueOrderRepository: Repository<QueueOrder>;



  constructor(dbConnection: Connection) {
    this.queueRepository = dbConnection.getRepository(QueueItem);
    this.queueOrderRepository = dbConnection.getRepository(QueueOrder);

    console.log('\x1b[32m     -  QueueService init\x1b[0m');
  }



  public async getAll(): Promise<{res: any, err: Error}> {

    // read queue items and queue order from the database
    let queueItems: QueueItem[] = null;
    let queueItemsOrder: QueueOrder[] = null;
    try {
      queueItems = await this.queueRepository.find();
      queueItemsOrder = await this.queueOrderRepository.find();
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't get queue items from database.", 2, error)}; 
    }

    queueItems.forEach((qi) => {
      qi['thumbnailUrl'] = qi.sourceType === VideoSourceType.YOUTUBE ? `${ROOT_API_URL}${YT_THUMBNAILS_ASSETS_URL}/${qi.externalId}` : null;
    });

    // if there is an order in database, send the queue items ordered
    if(queueItemsOrder.length > 0) {
      const queueItemsIDsOrder: number[] = JSON.parse(queueItemsOrder[0].orderObj);

      const queueItemsObj: Map<number, QueueItem> = queueItems.reduce((map: Map<number, QueueItem>, queueItem: QueueItem) => {
        map.set(queueItem.id, queueItem);
        return map;
      }, new Map());

      const queueItemsOrdered: QueueItem[] = queueItemsIDsOrder.map((queueItemId) => queueItemsObj.get(queueItemId));

      return {res: queueItemsOrdered, err: null};
    }

  
    return {res: queueItems, err: null};
  }

  

  public async getOne(queueItemId: number): Promise<{res: any, err: Error}> {
    if(queueItemId == null) {
      return {res: null, err: new Error("Couldn't get queue item from database.", 1,)};
    }

    try {
      const queueItem: QueueItem = await this.queueRepository.findOne(queueItemId);
      queueItem['thumbnailUrl'] = queueItem.sourceType === VideoSourceType.YOUTUBE ? `${ROOT_API_URL}${YT_THUMBNAILS_ASSETS_URL}/${queueItem.externalId}` : null;

      return {res: queueItem, err: null};
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't get queue item from database.", 2, error)}; 
    }
  }

  

  public async add(newQueueItem: AddQueueItem, query: any = null): Promise<{res: any, err: Error}> {
    if(newQueueItem == null || newQueueItem.type == null || 
      (newQueueItem.type !== VideoSourceType.YOUTUBE && newQueueItem.type !== VideoSourceType.LOCAL) || 
      newQueueItem.url == null) {
      return {res: null, err: new Error("Couldn't add queue item.", 1)};
    }

    const afterId: number = Number(query.afterId);
    const addFirst: boolean = query.addFirst != undefined;
    

    // add new queue item, depending on the type
    if(newQueueItem.type === VideoSourceType.YOUTUBE) {

      // get youtube video info
      const {res: videoInfo, err} = await YoutubeService.getVideoInfo(newQueueItem.url);
      if(err != null) {
        return {res: null, err: new Error("Couldn't add queue item.", 3)};
      }

      const videoTitle = videoInfo.title;
      const artistName = videoInfo.channel.name;
      const videoId = videoInfo.id;
      const thumbnailUrl = videoInfo.thumbnails[0].url;
      const runtime = Number(videoInfo.lengthSeconds);

      const queueThumbnailsDir = '.' + path.sep + QUEUE_THUMBNAILS_DIR;
      const requiredThumbnailFile = videoId + '.jpg';


      // check whether the required thumbnail has already been downloaded
      let downloadThumbnail = true;
      try {
        const tmpThumbnails: string[] = fs.readdirSync(queueThumbnailsDir);
        downloadThumbnail = !tmpThumbnails.includes(requiredThumbnailFile);
      }
      catch(err) {}


      // download thumbnail
      if(downloadThumbnail) {
        process.stdout.write('\x1b[33mDownloading thumbnail ...\x1b[0m  ');

        const {res, err: err1} = await downloadFile(thumbnailUrl, queueThumbnailsDir, requiredThumbnailFile);

        if(err1 != null) {
          console.error('\x1b[31m error \x1b[0m')
        }
        else {
          console.log('\x1b[32m done \x1b[0m');
        }
      }


      // save queue item to database
      let queueItemDb: QueueItem = null;
      {
        const queueItem = {
          sourceType: newQueueItem.type,
          externalId: videoId,
          title: videoTitle,
          artist: artistName,
          runtime: runtime
        };

        try {
          queueItemDb = await this.queueRepository.save(queueItem);
          queueItemDb['thumbnailUrl'] = `${ROOT_API_URL}${YT_THUMBNAILS_ASSETS_URL}/${videoId}`;
        }
        catch (error) {
          return {res: null, err: new Error("Couldn't add queue item.", 4)};
        }
      }

      const newQueueItemId = queueItemDb.id;

      // update queue items order in table 'queue_order'
      {
        let queueItemsOrder: QueueOrder[] = null;
        
        // get queue items order from database
        try {
          queueItemsOrder = await this.queueOrderRepository.find();
        }
        catch(error) {
          return {res: null, err: new Error("Couldn't add queue item.", 5, error)};
        }

        // if there are not records in table 'queue_order', a new record should be added
        const addQueueOrder = queueItemsOrder.length === 0;

        const queueItemsIDsOrder: number[] = !addQueueOrder ? JSON.parse(queueItemsOrder[0].orderObj) : [];

        // add the new queue item's ID in the correct position
        let newQueueItemsIDsOrder: number[] = null;
        if(addFirst) {                    // add queue item, at the start of the queue
          newQueueItemsIDsOrder = [newQueueItemId, ...queueItemsIDsOrder];
        }
        else if(!isNaN(afterId)) {        // add queue item, at after the queue item with ID 'afterId'
          newQueueItemsIDsOrder = [...queueItemsIDsOrder];
          const afterIndex = queueItemsIDsOrder.findIndex((queueItemIndex) => queueItemIndex === afterId);
          const queueIndex = afterIndex + 1;

          if(afterIndex >= 0) {
            newQueueItemsIDsOrder.splice(queueIndex, 0, newQueueItemId);
          }
        }
        else {                            // add queue item, at the end of the queue
          newQueueItemsIDsOrder = [...queueItemsIDsOrder, newQueueItemId];
        }

        // save queue order to database
        try {
          const newQueueOrder = {
            orderObj: JSON.stringify(newQueueItemsIDsOrder)
          };

          if(addQueueOrder) {
            await this.queueOrderRepository.save(newQueueOrder);
          }
          else {
            await this.queueOrderRepository.update(queueItemsOrder[0].id, newQueueOrder);
          }
        }
        catch(error) {
          return {res: null, err: new Error("Couldn't add queue item.", 6, error)};
        }
      }

      return {res: queueItemDb, err: null};
    }
    else if(newQueueItem.type === VideoSourceType.LOCAL) {
      return {res: null, err: new Error("Couldn't add queue item. Queue item of type 'LOCAL' has not been implemented.", 5)};
    }

    
    return {res: null, err: new Error("Couldn't add queue item.", 6)};
  }



  public async remove(queueItemId: number): Promise<{res: any, err: Error}> {
    if(queueItemId == null) {
      return {res: null, err: new Error("Couldn't remove queue item.", 1,)};
    }


    // get queue item from database
    let queueItem: QueueItem = null;
    try {
      queueItem = await this.queueRepository.findOne(queueItemId);
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't remove queue item.", 2, error)}; 
    }

    // a queue item was not found with the request id
    if(queueItem == null) {
      return {res: null, err: new Error("Couldn't remove queue item.", 3)}; 
    }

    
    // get all queue items from database with 'externalId' same as the request queue item's
    let sameExternalIdQueueItems: QueueItem[] = null;
    try {
      sameExternalIdQueueItems = await this.queueRepository.find({where: {id: Not(queueItemId), externalId: queueItem.externalId}});
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't remove queue item.", 4, error)}; 
    }


    // if there aren't other queue items with the same 'externalId' in the database, delete thumbnail
    if(sameExternalIdQueueItems.length === 0) {
      const thumbnailFilePath = '.' + path.sep + QUEUE_THUMBNAILS_DIR + path.sep + queueItem.externalId + '.jpg';

      try {
        fs.unlinkSync(thumbnailFilePath);
      }
      catch(error) {
        return {res: null, err: new Error("Couldn't remove queue item.", 5, {msg: ` Failed to delete file with path  '${thumbnailFilePath}' .`,err: error})};
      }
    }


    // delete queue item from the database
    try{
      const deleteRes = await this.queueRepository.delete(queueItemId);
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't remove queue item.", 6)};
    }


    // save queue order to database 
    {
      let queueItemsOrder: QueueOrder[] = null;
        
      // get queue items order from database
      try {
        queueItemsOrder = await this.queueOrderRepository.find();
      }
      catch(error) {
        return {res: null, err: new Error("Couldn't remove queue item.", 7, error)};
      }

      const queueItemsIDsOrder: number[] = JSON.parse(queueItemsOrder[0].orderObj);

      if(queueItemsIDsOrder.length > 1) {
        const queueItemIndex = queueItemsIDsOrder.indexOf(queueItemId);
        if(queueItemIndex < 0) {
          return {res: null, err: new Error("Couldn't remove queue item.", 8)};
        }
  
        queueItemsIDsOrder.splice(queueItemIndex, 1);
        const newQueueItemsIDsOrder = [...queueItemsIDsOrder];
  
        try {
          const newQueueOrder = {
            orderObj: JSON.stringify(newQueueItemsIDsOrder)
          };
  
          await this.queueOrderRepository.update(queueItemsOrder[0].id, newQueueOrder);
        }
        catch(error) {
          return {res: null, err: new Error("Couldn't remove queue item.", 9, error)};
        }
      }
      else {
        // delete all rows from 'queue_order' table
        try {
          await this.queueOrderRepository.clear();
        }
        catch(error) {
          return {res: null, err: new Error("Couldn't remove queue item.", 10, {err: error})};
        }
      }
    }

    return {res: true, err: null};
  }



  public async removeAll(): Promise<{res: any, err: Error}> {

    // get all temp youtube queue items' thumbnails paths
    let tmpThumbnailsFiles: string[];
    const queueThumbnailsDir = '.' + path.sep + QUEUE_THUMBNAILS_DIR;
    try {
      tmpThumbnailsFiles = fs.readdirSync(queueThumbnailsDir);
    }
    catch(error) {
      return {res: null, err: new Error("Failed to remove all queue items.", 1, {err: error})};
    }


    // delete all youtube queue thumbnails
    const thumbnailsPaths = tmpThumbnailsFiles.map((f) => queueThumbnailsDir + path.sep + f);
    for(let f of thumbnailsPaths) {
      try {
        fs.unlinkSync(f);
      }
      catch(error) {
        return {res: null, err: new Error("Failed to remove all queue items.", 2, {err: error})};
      }
    }

    
    // delete all rows from 'queue' table
    try {
      await this.queueRepository.clear();
    }
    catch(error) {
      return {res: null, err: new Error("Failed to remove all queue items.", 3, {err: error})};
    }

    // delete all rows from 'queue_order' table
    try {
      await this.queueOrderRepository.clear();
    }
    catch(error) {
      return {res: null, err: new Error("Failed to remove all queue items.", 4, {err: error})};
    }


    return {res: true, err: null};
  }
  
}