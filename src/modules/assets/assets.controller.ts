import { Router, Request, Response } from 'express';
import { AssetsService } from './assets.service';





export class AssetsController {


  constructor(private assetsService: AssetsService) {
    console.log('\x1b[32m     -  AssetsController init\x1b[0m');
  }



  public getRouter(): Router {
    const router = Router();

    router.get('/tmp/queue-thumbnails/youtube/:youtubeId', (request: Request, response: Response) => this.getOne(request, response));
    
    return router;
  }



  private async getOne(request: Request, response: Response) {
    const youtubeId: string = request.params.youtubeId;
    
    const {res, err} = await this.assetsService.getOne(youtubeId);
    if(err != null) {
      response.status(404).send({msg: "Couldn't get asset!"});
    }
    else {
      response.writeHead(200, {'Content-Type': 'images/jpg'});
      response.end(res, 'binary');
    }
  }

}