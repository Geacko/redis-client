import type { 
    Command 
} from './types.ts'

import { 
    Resp3DecoderStream, type Resp3ParserOptions
} from '@geacko/resp3-parser'

import { 
    CommandEncoderQueue 
} from './command_encoder_queue.ts'

/** 
 *  @internal 
 */
export class CommandProcessor {

    /**
     *  Writer
     */
    private writer

    /**
     *  RESP (v2/v3) reader.
     */
    private reader

    /**
     *  Result of current asynchronous 
     *  write process.
     */
    private currentProcess?: Promise<void>

    /**
     *  Queue providing data to write 
     *  to the connection.
     */
    private queue = new CommandEncoderQueue()

    /**
     *  number of replies being decoded
     */
    private unsolveds = 0

    /**
     *  Set to "true" if no read and write 
     *  operations are allowed.
     */
    private closed = !1

    /**
     *  Number of commands in the queue 
     *  waiting to be encoded.
     */
    get count() {
        return this.queue.count
    }

    /**
     *  Returns `true` if processor is closed.
     */
    get isClosed() : boolean {
        return this.closed
    }

    /**
     *  Returns `true` if the writing process 
     *  is in progress. `false` otherwise.
     */
    get isWriting() {
        return this.currentProcess instanceof Promise
    }

    /**
     *  Returns `true` if the reading process 
     *  is in progress. `false` otherwise.
     */
    get isReading() {
        return this.unsolveds != 0
    }

    /**
     *  constructor
     */
    constructor(duplex: [
        ReadableStream<Uint8Array>,
        WritableStream<Uint8Array>
    ] , opts: Resp3ParserOptions) {

        this.writer = duplex[1].getWriter()
        this.reader = duplex[0].pipeThrough(new Resp3DecoderStream(opts)).getReader()

    }

    /**
     *  Add new command to write.
     */
    add(cmd: Command) {
        this.closed || this.queue.add(cmd)
    }

    /**
     *  Execute the writing process.
     */
    process() : Promise<void> {
        return this.currentProcess ??= this.processInternal().then(() => this.currentProcess = void 0)
    }

    /**
     *  Writes all available data to the stream.
     */
    private processInternal() : Promise<void> {

        const xs = this.queue.next().value

        if (xs) {
            
            return this.writer.write(xs).then(
                x => this.queue.count ? this.processInternal() : x
            )

        }

        else {

            return Promise.resolve()
        
        }

    }

    /**
     *  Reads the next available response 
     *  in the stream. Returns always `Promise<undefined>` if
     *  the processor is closed.
     */
    read() {

        if (this.closed) {
            return Promise.resolve(void 0)
        }

        this.unsolveds++

        const out = this.reader.read().then(({ value: x }) => (
            this.unsolveds-- , x
        ))

        return out
    
    }

    /**
     *  Makes all future read and write operations 
     *  impossible. Calling `close` releases the 
     *  reader and writer locks.
     */
    close() {

        // clear state
        this.currentProcess = void 0
        this.closed         = true
        this.unsolveds      = 0
        this.queue.clear()

        // dispose readable stream
        this.reader.cancel()
  
    }

}
