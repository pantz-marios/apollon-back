

export interface YoutubeVideo {
  id: string;
  type: string;
  title: string;
  url: string;
  channel: {name: string; url: string;};
  thumbnails: {url: string; width: number; height: number}[];
  bestThumbnail: {url: string; width: number; height: number};
  duration: string;
  views: number;
}


export interface YoutubeVideoExtraInfo {
  id: string;
  title: string;
  url: string;
  channel: {name: string; url: string;};
  thumbnails: {url: string; width: number; height: number}[];
  lengthSeconds: number;
  views: number;
  formats: YoutubeVideoFormat[];
}


export interface YoutubeVideoFormat {
  url: string;
  width: number;
  height: number;
}