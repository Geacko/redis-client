import type { 
    Resp3Reply 
} from '@geacko/resp3-parser'

import type { 
    Command,
    CommandBatch,
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
export class StreamHandler implements AsyncIterable<Resp3Reply> {

    /**
     *  command processor
     */
    #proc: CommandProcessor

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
     *  await db.repl() // "0"
     *  console.log(db.commandReplyCount) // 1
     *  await db.repl() // "1"
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
     *  Constructor.
     *  @param readable Input stream 
     *  @param writable Output stream
     */
    constructor(
        readable: ReadableStream<Uint8Array>,
        writable: WritableStream<Uint8Array>,
    ) {

        this.#proc = new CommandProcessor(
            readable,
            writable
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
     *  console.log(await db.repl())
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
     *  the queue.
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
     *  await db.repl() // "0"
     *  await db.repl() // "1"
     *  await db.repl() // "2"
     *  ```
     */
    repl<T extends Resp3Reply>() : Promise<T> {
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
     *  console.log(await db.replall<Replies>())
     *  ```
     * 
     */
    replall<T extends Resp3Reply[]>(count: number = Infinity) : Promise<T> {

        return clampedFromAsyncLike<T>(
            0, count, this.commandReplyCount, () => this.repl()
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

}
