import type { 
    Gateway, Command
} from './types.ts'

import type { 
    Resp3ParserOptions 
} from '@geacko/resp3-parser'

import { 
    CommandProcessor
} from './command_processor.ts'

import {
    isCmd
} from './utils.ts'

/**
 *  Client
 */
export class Client<T extends Command = Command> implements Disposable, AsyncDisposable {

    /**
     *  command processor
     */
    #proc: CommandProcessor

    /**
     *  underlying duplex
     */
    #conn: Gateway

    /**
     *  Returns `true` if the writing or reading process is 
     *  still in progress. `false` otherwise.
     * 
     *  **Example**
     * 
     *  ```ts
     *  db.send(['PING'])
     *  console.log(db.isBusy) // true
     *  await db.read()
     *  console.log(db.isBusy) // false
     *  ```
     */
    get isBusy() : boolean {
        return this.#proc.isReading || this.#proc.isWriting
    }

    /**
     *  Returns `true` if client is closed. `false`
     *  otherwise.
     *  
     *  **Example**
     *  ```ts
     *  console.log(db.isClosed) // false
     *  db.close()
     *  console.log(db.isClosed) // true
     *  ```
     */
    get isClosed() : boolean {
        return this.#proc.isClosed
    }

    /**
     *  Constructor.
     */
    constructor(
        connection: Gateway, opts: Resp3ParserOptions = {}
    ) {

        this.#conn = connection
        this.#proc = new CommandProcessor([
            connection.readable,
            connection.writable,
        ] , opts)
    
    }

    /**
     *  Send a command.
     * 
     *  **Example**
     * 
     *  ```ts
     *  // Send the `HELLO` command
     *  db.send([ 'HELLO', '3' ])
     *  
     *  // Read the response
     *  console.log(await db.read())
     *  ```
     * 
     *  @param cmd Command to send.
     */

    send(
        cmd : T
    ) : this

    /**
     *  Send many commands at once.
     * 
     *  **Example**
     * 
     *  ```ts
     *  // Send 5 `PING`
     *  db.send([
     *      [ 'PING', '0' ],
     *      [ 'PING', '1' ],
     *      [ 'PING', '2' ],
     *      [ 'PING', '3' ],
     *      [ 'PING', '4' ],
     *  ])
     * 
     *  // Send 5 other `PING`
     *  db.send({ length: 5 }, (_, i) => {
     *      return [ 'PING' , 5 + i ]
     *  })
     * 
     *  // Read all
     *  console.log(await db.readMany(10))
     *  ```
     * 
     *  @param cmd Commands to send.
     *  @param map A mapping function to call on every element of the array
     */

    send(
        cmd : Iterable<T> | ArrayLike<T>, map?: (x: T, i: number) => T
    ) : this

    /**
     *  Send one or many commands at 
     *  once.
     */
    send(
        cmd: Iterable<T> | ArrayLike<T> | T, map: (x: T, i: number) => T = x => x
    ) : this {

        const proc = this.#proc

        if (isCmd(cmd)) {
            proc.add(cmd)
        }
        
        else {

            Array.from(cmd, (x, i) => 
                proc.add(map(x, i))
            )

        }

        proc.process()
        
        return this

    }

    /**
     *  Reads the next available response in 
     *  the queue. Returns always `Promise<undefined>` if
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
    read<U>() : Promise<U | undefined> {
        return this.#proc.read<U>()
    }

    /**
     *  Reads multiple replies at once.
     * 
     *  **Example**
     * 
     *  ```ts
     *  // Send 3 'PING'
     *  db.send(['PING', '0'])
     *  db.send(['PING', '1'])
     *  db.send(['PING', '2'])
     *  
     *  // Read all
     *  await db.readMany(3) // [ "0", "1", "2" ]
     *  ```
     */
    readMany<U extends unknown[]>(
        count: number
    ) : Promise<U> {

        const xs = new Array(count)

        for (
            let i = 0; 
                i < count; 
                i++
        ) {

            xs[i] = this.read()
        
        }

        return <Promise<U>>Promise.all(xs)

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
     *      // We wait for all write operations to
     *      // finish to close the client
     *      db.close()
     *  })
     *  ```
     */
    nop() : Promise<void> {
        return this.#proc.process()
    }

    /**
     *  Closes the client if it is not already 
     *  closed. Makes all future read and write 
     *  operations impossible. Calling `close` releases the 
     *  reader and writer locks.
     * 
     *  **Example**
     *  ```ts
     *  db.close()
     *  console.log(await db.send([ 'PING' ]).read()) // undefined
     *  ```
     */
    close() {

        if (this.isClosed) {
            return
        }

        this.#proc.close()
        this.#conn.close &&
        this.#conn.close()
    
    }

    /**
     *  Calls `Client.close()`.\
     *  Implementation of the `Disposable`
     *  protocol.
     */
    [Symbol.dispose]() : void {
        return this.close()
    }

    /**
     *  Calls `Client.close()` when all 
     *  write operations are complete.\
     *  Implementation of the `AsyncDisposable`
     *  protocol.
     */
    [Symbol.asyncDispose]() : Promise<void> {
        
        let i = 0
        return new Promise<void>(ret => i = setInterval(() => {
            this.isBusy || this.close() || ret(clearInterval(i))
        } , 0))

    }

}
