require('module-alias/register');
import express, { Router } from 'express';
import { createConnection, Connection} from 'typeorm';
import cors from 'cors';
import { YoutubeModule } from '@modules/youtube/youtube.module';
import { QueueModule } from '@modules/queue/queue.module';
import { AssetsModule } from '@modules/assets/assets.module';
import { PORT } from '@env';




main();





function main() {

  // create typeorm connection and start server
  createConnection().then(connection => startServer(connection));

}


async function startServer(connection: Connection) {
  // create and setup express app
  const app = express();
  app.use(cors({origin: '*'}));
  app.use(express.json());

  // add router
  app.use('/api', await getApiRouter(connection));

  // star express server
  const port = PORT;
  app.listen(port);

  console.log(`Started server on  http://localhost:${port}`);
}



async function getApiRouter(connection: Connection) {
  const apiRouter = Router();


  //   /api/youtube
  const youtubeModule: YoutubeModule = new YoutubeModule();
  const youtubeRouter = await youtubeModule.init();
  apiRouter.use('/youtube', youtubeRouter);

  //   /api/queue
  const queueModule: QueueModule = new QueueModule();
  const queueRouter = await queueModule.init(connection);
  apiRouter.use('/queue', queueRouter);

  //   /api/assets
  const assetsModule: AssetsModule = new AssetsModule();
  const assetsRouter = assetsModule.init();
  apiRouter.use('/assets', assetsRouter);

  console.log('\n\n');

 
  return apiRouter;
}