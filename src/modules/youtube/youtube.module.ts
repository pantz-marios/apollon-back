import { Router } from 'express';
import { YoutubeController } from './youtube.controller';





export class YoutubeModule {
  private initialized = false;


  public async init(): Promise<Router> {
    if(this.initialized) {
      return;
    }
    this.initialized = true;


    console.log('\x1b[33m[*]  YoutubeModule init\x1b[0m');

    // create controller
    const controller = new YoutubeController();

    // get Router from controller
    const router = controller.getRouter();

    return router;
  }

}
