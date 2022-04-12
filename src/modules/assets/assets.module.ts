import { Router } from 'express';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';







export class AssetsModule {
  private initialized = false;


  public init(): Router {
    if(this.initialized) {
      return;
    }
    this.initialized = true;


    console.log('\x1b[33m[*]  AssetsModule init\x1b[0m');


    // create service
    const assetsService = new AssetsService();

    // create controller
    const controller = new AssetsController(assetsService);

    // get Router from controller
    const router = controller.getRouter();

    
    return router;
  }


}
