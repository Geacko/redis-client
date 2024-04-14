import type { 
    Resp3Reply 
} from '@geacko/resp3-parser'

import type { 
    Command,
    CommandBatch,
    UnderlyingConnection
} from './types.ts'

import { 
    CommandProcessor
} from './command_processor.ts'

import {
    isCmd,
    clampedFromAsyncLike
} from './utils.ts'

/**
 *  Stream handler.
 */
export class Client implements Disposable, AsyncDisposable, AsyncIterable<Resp3Reply> {

    /**
     *  command processor
     */
    #proc: CommandProcessor

    /**
     *  underlying connection
     */
    #conn: UnderlyingConnection

    /**
     *  Number of replies available for 
     *  reading.
     *  
     *  **Example**
     * 
     *  ```ts
     *  // send 2 commands
     *  db.send(['PING', 0])
     *  db.send(['PING', 1])
     *  
     *  console.log(db.commandReplyCount) // 2
     *  await db.read() // "0"
     *  console.log(db.commandReplyCount) // 1
     *  await db.read() // "1"
     *  console.log(db.commandReplyCount) // 0
     *  ```
     */
    get commandReplyCount() : number {
        return this.#proc.commandReplyCount
    }

    /**
     *  Returns `true` if the writing process is 
     *  still in progress. `false` otherwise.
     * 
     *  **Example**
     * 
     *  ```ts
     *  db.send(['PING'])
     *  console.log(db.isBusy) // true
     *  await db.nop()
     *  console.log(db.isBusy) // false
     *  ```
     */
    get isBusy() : boolean {
        return this.#proc.isWriting
    }

    /**
     *  Returns `true` if client is closed.
     */
    get isClosed() : boolean {
        return this.#proc.isClosed
    }

    /**
     *  Constructor.
     *  @param readable Input stream 
     *  @param writable Output stream
     */
    constructor(
        connection: UnderlyingConnection
    ) {

        this.#conn = connection
        this.#proc = new CommandProcessor(
            connection.readable,
            connection.writable
        )
    
    }

    /**
     *  Send command(s).
     * 
     *  **Basic Usage**
     * 
     *  ```ts
     *  // Send the `HELLO` command
     *  db.send([ 'HELLO', '3' ])
     *  
     *  // Read the response
     *  console.log(await db.read())
     *  ```
     *  **Pipeline**
     * 
     *  ```ts
     *  // Send the 6 `PING`
     *  db.send([
     *      [ 'PING', '0' ],
     *      [ 'PING', '1' ],
     *      [ 'PING', '2' ],
     *      [ 'PING', '3' ],
     *      [ 'PING', '4' ],
     *      [ 'PING', '5' ],
     *  ])
     * 
     *  // Read all
     *  for await (const x of db) {
     *      console.log(x)
     *  }
     *  ```
     * 
     *  @param cmd Command(s) to send.
     */
    send(
        cmd: Command | CommandBatch
    ) : this {

        const proc = this.#proc

        if (isCmd(cmd)) {
            proc.add(cmd)
        }

        else {

            Array.from(
                cmd, 
                cmd => proc.add(cmd)
            )
        
        }

        proc.process()
        
        return this

    }

    /**
     *  Reads the next available response in 
     *  the queue. Returns always `null` if
     *  the client is closed.
     * 
     *  **Example**
     * 
     *  ```ts
     *  // Send
     *  db.send(['PING', '0'])
     *  db.send(['PING', '1'])
     *  db.send(['PING', '2'])
     *  
     *  // Read 
     *  await db.read() // "0"
     *  await db.read() // "1"
     *  await db.read() // "2"
     *  ```
     */
    read<T extends Resp3Reply>() : Promise<T> {
        return this.#proc.read() as Promise<T>
    }

    /**
     *  Returns multiples replies as an array.
     *  If the `count` parameter is specified and is 
     *  less than the number of available replies, 
     *  returns `count` replies. If the `count` parameter 
     *  is missing or greater than the number of available 
     *  replies, returns all available replies.
     *  
     *  **Example**
     * 
     *  ```ts
     *  db.send([ 'HELLO' , 3 ])
     *  db.send([ 'PING' ])
     *  db.send([ 'HSET' , 'some-key' , 'a' , 0 , 'b' , 1 ])
     * 
     *  type Replies = [ 
     *      Record<string, any>, string, number 
     *  ]
     * 
     *  console.log(await db.readall<Replies>())
     *  ```
     * 
     */
    readall<T extends Resp3Reply[]>(count: number = Infinity) : Promise<T> {

        return clampedFromAsyncLike<T>(
            0, count, this.commandReplyCount, () => this.read()
        )

    }

    /**
     *  Forces the command queue to run and 
     *  waits for it to complete.
     *  
     *  **Example**
     * 
     *  ```ts
     *  for (let i = 0 ; i < 1000; i++) {
     *      db.send(['PING', i])
     *  }
     *  
     *  db.nop().then(() => {
     *      db.close()
     *  })
     *  ```
     */
    nop() : Promise<void> {
        return this.#proc.process()
    }

    /**
     *  Close the connection.\
     *  Note: Does not close underlying streams.
     */
    close() {

        if (this.isClosed) {
            return
        }

        this.#proc.close()
        this.#conn.close()
    
    }

    /**
     *  Iterates through all available replies. 
     *  Impementation of the `AsyncIterator` 
     *  protocol.
     * 
     *  **Example**
     * 
     *  ```ts
     *  db.send([
     *      ['PING', 0],
     *      ['PING', 1],
     *      ['PING', 2],
     *      ['PING', 3],
     *  ])
     * 
     *  for await (const x of db) {
     *      console.log(x) 
     *  }
     * 
     *  console.log(db.commandReplyCount) // 0
     *  ```
     */
    [Symbol.asyncIterator]() : AsyncIterator<Resp3Reply> {

        const proc = this.#proc

        return {

            next: async () => proc.commandReplyCount ? { 
                done: !1, value: await proc.read()
            } : {
                done: !0
            }

        } as AsyncIterator<Resp3Reply>

    }

    /**
     *  Close the connection. 
     *  Implementation of the `Disposable`
     *  protocol.
     */
    [Symbol.dispose]() : void {
        return this.close()
    }

    /**
     *  Close the connection asynchronously. 
     *  Implementation of the `Disposable`
     *  protocol.
     */
    async [Symbol.asyncDispose]() : Promise<void> {
        return await this.nop().then(() => this.close())
    }

}
