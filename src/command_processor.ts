import type { 
    Command 
} from './types.ts'

import { 
    Resp3DecoderStream, type Resp3ParserOptions
} from '@geacko/resp3-parser'

import { 
    CommandEncoderQueue 
} from './command_encoder_queue.ts'

const NOP = { 
    value: void 0 
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
    private currentWritingProcess?: Promise<void>

    /**
     *  Queue providing data to write 
     *  to the connection.
     */
    private queue = new CommandEncoderQueue()

    /**
     *  number of replies being decoded
     */
    private readings = 0

    /**
     *  Set to "true" if no read and write 
     *  operations are allowed.
     */
    private closed = !1

    /**
     *  Returns `true` if the writing process 
     *  is in progress. `false` otherwise.
     */
    get isWriting() {
        return this.currentWritingProcess instanceof Promise
    }

    /**
     *  Returns `true` if the reading process 
     *  is in progress. `false` otherwise.
     */
    get isReading() {
        return this.readings != 0
    }

    /**
     *  Returns `true` if processor is closed.
     */
    get isClosed() : boolean {
        return this.closed
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

        return this.currentWritingProcess ??= this.processInternal().then(() => {
               this.currentWritingProcess = void 0
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
    async read<T>() {

        this.readings++

        const {
            value: x
        } = await (
            this.closed ? Promise.resolve(NOP) : this.reader.read()
        )

        this.readings--

        return x as T
    
    }

    /**
     *  Makes all future read and write operations 
     *  impossible. Calling `close` releases the 
     *  reader and writer locks.
     */
    close() {

        // clear state
        this.currentWritingProcess = void 0
        this.closed                = true
        this.readings              = 0
        this.queue.clear()

        // release locks
        this.writer.releaseLock()
        this.reader.releaseLock()
            
    }

}
