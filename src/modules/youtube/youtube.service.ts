import ytdl from 'ytdl-core';
const ytsr = require('ytsr');
import { Error } from '@modules/error-handling/error';
import { YoutubeVideo, YoutubeVideoExtraInfo } from './youtube.model';





export async function search(query: string, limit=10): Promise<{res: YoutubeVideo[], err: Error}> {
  limit = limit ? (limit < 0 ? 10 : limit) : 10;

  // search for youtube videos
  try {
    const res = await ytsr(query, {limit: limit});

    const items: YoutubeVideo[] = res.items.filter((item) => item.type === 'video').map((item) => {
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        url: item.url,
        channel: {name: item.author.name, url: item.author.url},
        thumbnails: item.thumbnails,
        bestThumbnail: item.bestThumbnail,
        duration: item.duration,
        views: item.views,
      };
    });

    return {res: items, err: null};
  }
  catch(error) {
    return {res: null, err: new Error("Couldn't search for youtube videos.", 1, error)}; 
  }
}



export async function getVideoInfo(videoUrl: string): Promise<{res: YoutubeVideoExtraInfo, err: Error}> {

  // get youtube video info
  try {
    const res = await ytdl.getInfo(videoUrl);

    const videoInfo: YoutubeVideoExtraInfo = {
      id: res.videoDetails.videoId,
      title: res.videoDetails.title,
      url: res.videoDetails.video_url,
      channel: {name: res.videoDetails.author.name, url: res.videoDetails.author.channel_url},
      thumbnails: res.videoDetails.thumbnails,
      lengthSeconds: Number(res.videoDetails.lengthSeconds),
      views: Number(res.videoDetails.viewCount),
      formats: res.formats.map((f) => {
        return {
          url: f.url,
          width: f.width,
          height: f.height
        };
      })
    };

    return {res: videoInfo, err: null};
  }
  catch(error) {
    return {res: null, err: new Error("Couldn't get YouTube video info.", 1, error)}; 
  }
}