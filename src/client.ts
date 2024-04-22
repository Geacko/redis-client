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
     *  console.log(await db.readMany(6))
     *  ```
     * 
     *  @param cmd Command(s) to send.
     */
    send(
        cmd: T | Iterable<T> | ArrayLike<T>
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
    read<T>() : Promise<T> {
        return this.#proc.read<T>()
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
     *  ...
     *  ...
     *  ...
     */
    readMany<T extends unknown[]>(
        count: number
    ) : Promise<T> {
        
        return Promise.all(Array.from({ length: count }, () => this.read())) as Promise<T>

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
