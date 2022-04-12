import * as path from "path";
const fs = require('fs');
import { Error } from '@modules/error-handling/error';
import { QUEUE_THUMBNAILS_DIR } from '@env';





export class AssetsService {


  constructor() {
    console.log('\x1b[32m     -  AssetsService init\x1b[0m');
  }



  public async getOne(youtubeId: string): Promise<{res: any, err: Error}> {
    if(youtubeId == null) {
      return {res: null, err: new Error("Couldn't get asset.", 1)};
    }

    const assetFullPath = `.${path.sep}${QUEUE_THUMBNAILS_DIR}${path.sep}${youtubeId}.jpg`;

    try{
      const img = fs.readFileSync(assetFullPath);
      return {res: img, err: null};
    }
    catch(error) {
      return {res: null, err: new Error("Couldn't get asset.", 2)};
    }
  }
  
}