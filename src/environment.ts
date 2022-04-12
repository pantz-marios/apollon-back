import * as path from "path";





export const PORT: number = 3000;
export const ROOT_API_URL: string = `http://localhost:${PORT}/api`;

export const TMP_THUMBANAILS_PATH = 'profile' + path.sep + 'tmp' + path.sep + 'queue-thumbnails';
export const QUEUE_THUMBNAILS_DIR = TMP_THUMBANAILS_PATH + path.sep + 'youtube';

export const YT_THUMBNAILS_ASSETS_URL = '/assets/tmp/queue-thumbnails/youtube';
