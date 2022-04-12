import { Router, Request, Response } from 'express';
import * as YoutubeService from './youtube.service';





export class YoutubeController {


  constructor() {
    console.log('\x1b[32m     -  YoutubeController init\x1b[0m');
  }


  public getRouter(): Router {
    const router = Router();

    router.get('/search/:query', (request: Request, response: Response) => this.search(request, response));
    router.get('/video-info/', (request: Request, response: Response) => this.getVideoInfo(request, response));

    return router;
  }



  private async search(request: Request, response: Response) {
    const query = request.params.query;
    let limit = Number(request.query.limit);
    limit = isNaN(limit) ? null : limit;

    const {res, err} = await YoutubeService.search(query, limit);
    if(err != null) {
      response.status(404).send({msg: "Couldn't search for YouTube videos!", err});
    }
    else {
      response.json(res);
    }
  }



  private async getVideoInfo(request: Request, response: Response) {
    const url: string = <string> request.query.url;

    const {res, err} = await YoutubeService.getVideoInfo(url);
    if(err != null) {
      response.status(404).send({msg: "Couldn't get YouTube video info!", err});
    }
    else {
      response.json(res);
    }
  }

}