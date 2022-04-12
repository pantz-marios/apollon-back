import { Router, Request, Response } from 'express';
import { QueueService } from './queue.service';





export class QueueController {


  constructor(private queueService: QueueService) {
    console.log('\x1b[32m     -  QueueController init\x1b[0m');
  }


  public getRouter(): Router {
    const router = Router();

    router.get('/', (request: Request, response: Response) => this.getAll(request, response));
    router.get('/:id', (request: Request, response: Response) => this.getOne(request, response));
    router.post('/', (request: Request, response: Response) => this.add(request, response));
    router.delete('/:id', (request: Request, response: Response) => this.remove(request, response));
    router.delete('/', (request: Request, response: Response) => this.removeAll(request, response));
    
    return router;
  }



  private async getAll(request: Request, response: Response) {
    const {res, err} = await this.queueService.getAll();
    if(err != null) {
      response.status(404).send({msg: "Couldn't get queue items!"});
    }
    else {
      response.json(res);
    }
  }



  private async getOne(request: Request, response: Response) {
    const queueItemId: number = isNaN(Number(request.params.id)) ? null : Number(request.params.id);
    
    const {res, err} = await this.queueService.getOne(queueItemId);
    if(err != null) {
      response.status(404).send({msg: "Couldn't get queue item!"});
    }
    else {
      response.json(res);
    }
  }



  private async add(request: Request, response: Response) {
    const query = request.query;

    const {res, err} = await this.queueService.add(request.body, query);
    if(err != null) {
      response.status(404).send({msg: "Couldn't add queue item!"});
    }
    else {
      response.json(res);
    }
  }



  private async remove(request: Request, response: Response) {
    const queueItemId: number = isNaN(Number(request.params.id)) ? null : Number(request.params.id);
    
    const {res, err} = await this.queueService.remove(queueItemId);
    if(err != null) {
      response.status(404).send({msg: "Couldn't remove queue item!"});
    }
    else {
      response.json(res);
    }
  }



  private async removeAll(request: Request, response: Response) {
    const {res, err} = await this.queueService.removeAll();
    if(err != null) {
      response.status(404).send({msg: "Couldn't remove all queue items!"});
    }
    else {
      response.json(res);
    }
  }
  
}