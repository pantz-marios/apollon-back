const download = require('download');
import { Error } from '@modules/error-handling/error';





export async function downloadFile(url: string, distDir: string, filename: string): Promise<{res: any, err: Error}> {
  try {
    await download(url, distDir, {filename: filename});
  }
  catch(error) {
		return {res: null, err: new Error("Couldn't download file.", 1)};
  }

  return {res: null, err: null};
}