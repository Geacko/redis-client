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
    private currProcess?: Promise<void>

    /**
     *  Queue providing data to write 
     *  to the connection.
     */
    private queue = new CommandEncoderQueue()

    /**
     *  number of replies being decoded
     */
    private unsolved = 0

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
        return this.currProcess instanceof Promise
    }

    /**
     *  Returns `true` if the reading process 
     *  is in progress. `false` otherwise.
     */
    get isReading() {
        return this.unsolved != 0
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
    process() {

        return this.currProcess ??= this.processInternal().then(() => {

            // reset
            this.currProcess = void 0
            
            // run it again if the command queue is 
            // not empty
            if (this.count) {
                this.process()
            }

        })
    
    }

    /**
     *  Writes all available data to the stream.
     */
    private async processInternal() {

        const {
            queue, writer
        } = this

        let xs ; while ((
            xs = queue.next().value
        )) {

            this.closed || await writer.write(xs)

        }

    }

    /**
     *  Reads the next available response 
     *  in the stream. Returns always `Promise<undefined>` if
     *  the processor is closed.
     */
    read<T>() {

        if (this.closed) {
            return Promise.resolve(void 0)
        }

        this.unsolved++

        const out = this.reader.read().then(({ value: x }) => (
            this.unsolved-- , x as T
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
        this.currProcess = void 0
        this.closed      = true
        this.unsolved    = 0
        this.queue.clear()

        // dispose readable stream
        this.reader.cancel()
  
    }

}
