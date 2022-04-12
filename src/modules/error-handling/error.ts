


/**
 * 
 * msg  :  The message that should be returned(if needed) to user.
 * 
 * code :  Error code for internal use(not returned to user), unique in function level, typically incremental. The use of the
 *         code is to be able to pinpoint the exact location of the error in a function and with more
 *         information in the file and in the app.
 * 
 * o    :  Error object for internal use(not returned to user), typically an exception object.
 * 
 */
export class Error {
  constructor(public msg: string, public code: number, public o?:any) {}
}
