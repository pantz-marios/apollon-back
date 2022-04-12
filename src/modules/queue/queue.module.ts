import { Router } from 'express';
import { Connection } from 'typeorm';
const fs = require('fs');
import * as path from "path";
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { Error } from '@modules/error-handling/error';
import { QUEUE_THUMBNAILS_DIR } from '@env';





export class QueueModule {
  private initialized = false;


  public async init(dbConnection: Connection): Promise<Router> {
    if(this.initialized) {
      return;
    }
    this.initialized = true;


    console.log('\x1b[33m[*]  QueueModule init\x1b[0m');


    // make sure the directory structure for the temporary thumbnail images for queue items exists
    QueueModule.ensureDirStructure(QUEUE_THUMBNAILS_DIR);

    // create service
    const queueService = new QueueService(dbConnection);

    // create controller
    const controller = new QueueController(queueService);

    // get Router from controller
    const router = controller.getRouter();

    // delete unused queue thumbanils in path 'profile/tmp/queue-thumbnails/youtube'
    const {res, err} = await QueueModule.deleteUnusedQueueThumbnails(queueService);
    if(err != null) {
      console.error(err);
    }

    return router;
  }

  

  /**
   * 
   * Delete thumbnails in path  'profile/tmp/queue-thumbnails/youtube'  for the queue items' that do not exist in the database.
   * 
   */
  private static async deleteUnusedQueueThumbnails(queueService: QueueService): Promise<{res: boolean, err: Error}> {

    // get all queue items
    const {res: queueItems, err} = await queueService.getAll();

    if(err != null) {
      return {res: null, err: new Error('Failed to get all queue items', 1, err)};
    }

    
    const youtubeQueueItemIDs: string[] = queueItems.filter((qi) => qi.sourceType === 2).map((qi) => qi.externalId);
    const youtubeQueueItemIDsUnique: string[] = [...new Set(youtubeQueueItemIDs)];
      
    let tmpThumbnails: string[] = [];
    const queueThumbnailsDir = '.' + path.sep + QUEUE_THUMBNAILS_DIR;
    try {
      fs.readdirSync(queueThumbnailsDir);
    }
    catch(error) {
      return {res: null, err: new Error(`Failed to list files in path  '${queueThumbnailsDir}' .`, 2, {err: error})};
    }

    const tmpThumbnailIDs: string[] = tmpThumbnails.map((f: string) => f.substring(0, f.length-4));
    const tmpThumbnailIDsToDelete: string[] = tmpThumbnailIDs.filter((tmpThumbId) => !youtubeQueueItemIDsUnique.includes(tmpThumbId));
    const tmpThumbnailsToDelete: string[] = tmpThumbnailIDsToDelete.map((tmpThumbId) => '.' + path.sep + QUEUE_THUMBNAILS_DIR + path.sep + tmpThumbId + '.jpg');

    // delete required files
    for(let tmpThumbPath of tmpThumbnailsToDelete) {
      try {
        fs.unlinkSync(tmpThumbPath);
      }
      catch(error) {
        return {res: null, err: new Error(`Failed to delete file with path  '${tmpThumbPath}' .`, 3, {err: error})};
      }
    }
    

    return {res: true, err: null};
  }



  private static ensureDirStructure(dirStructure: string) {
    if(dirStructure == null) {
      return;
    }
  
    const dirs = __dirname.split(path.sep);
    dirs.pop();
    dirs.pop();
    dirs.pop();
    const rootDirPath = dirs.join(path.sep);
    const dirStructurePath = rootDirPath + path.sep + dirStructure;
  
    // create directory structure
    fs.mkdirSync(dirStructurePath, {recursive: true});
  }


}
