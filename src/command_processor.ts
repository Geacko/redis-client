import type { 
    Command, DuplexStream 
} from './types.ts'

import { 
    Resp3DecoderStream, type Resp3ParserOptions
} from '@geacko/resp3-parser'

import { 
    CommandEncoderQueue 
} from './command_encoder_queue.ts'

const enum Status {
    
    OPENED = 1,
    CLOSED = 0,

}

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
     *  Number of replies being decoded
     */
    private unsolveds = 0

    /**
     *  Status of the Processor.
     */
    private status = Status.OPENED

    /**
     *  Promise that fulfills when the stream 
     *  closes, or rejects if the stream throws 
     *  an error or the reader's lock is 
     *  released.
     */
    readonly closed

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
        return this.status == Status.CLOSED
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
    constructor({
        readable,
        writable,
    } : DuplexStream , opts: Resp3ParserOptions) {

        this.writer = writable.getWriter()
        this.reader = readable.pipeThrough(new Resp3DecoderStream(opts)).getReader()
        this.closed = this.reader.closed.then(() => {
            this.close()
        })

    }

    /**
     *  Add new command to write.
     */
    add(cmd: Command) {
        this.status == Status.OPENED && this.queue.add(cmd)
    }

    /**
     *  Execute the writing process.
     */
    process() : Promise<void> {
        return this.currentProcess ??= this.processTick().then(() => this.currentProcess = void 0)
    }

    /**
     *  Writes all available data to the stream.
     */
    private processTick() : Promise<void> {

        const xs = this.queue.next().value

        if (xs) {
            
            return this.writer.write(xs).then(
                x => this.queue.count ? this.processTick() : x
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

        if (this.status == Status.CLOSED) {
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
     *  impossible. 
     *  Calling `close` cancel the reader.
     */
    close() {

        if (this.status == Status.CLOSED) {
            return
        }

        // clear state
        this.currentProcess = void 0
        this.status         = Status.CLOSED
        this.unsolveds      = 0
        this.queue.clear()

        // dispose readable stream
        this.reader.cancel()
  
    }

}
