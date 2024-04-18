import type { 
    Command 
} from './types.ts'

import { 
    Resp3DecoderStream, Push
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
    private currentWritingProcess?: Promise<void>

    /**
     *  Number of replies available for 
     *  reading.
     */
    private count = 0

    /**
     *  number of replies being decoded
     */
    private processing = 0

    /**
     *  Queue providing data to write 
     *  to the connection.
     */
    private queue = new CommandEncoderQueue()

    /**
     *  Set to "true" if no read and write 
     *  operations are allowed.
     */
    private closed = false

    /**
     *  Number of pending commands.
     */
    get commandCount() {
        return Math.max(0, this.count - this.processing)
    }

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
        return this.processing != 0
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
    constructor(
        readable: ReadableStream<Uint8Array>,
        writable: WritableStream<Uint8Array>,
    ) {

        this.reader = readable.pipeThrough(new Resp3DecoderStream()).getReader()
        this.writer = writable.getWriter()

    }

    /**
     *  Add new command to write.
     */
    add(cmd: Command) {

        if (this.closed) {
            return
        }

        this.queue.add(cmd)
        this.count++    
    
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
     *  in the stream. Returns always `null` if
     *  the processor is closed.
     */
    async read() {

        if (this.closed) {
            return null
        }

        this.processing++

        const {
            value: x
        } = await this.reader.read()

        this.processing--

        this.count > 0 && !(x instanceof Push) &&
        this.count--

        return x!
    
    }

    /**
     *  Makes all future read and write operations 
     *  impossible. Calling `close` releases the 
     *  reader and writer locks.
     */
    close() {

        // clear state
        this.count                 = 0
        this.processing            = 0
        this.currentWritingProcess = void 0
        this.closed                = true
        this.queue.clear()

        // release locks
        this.writer.releaseLock()
        this.reader.releaseLock()
            
    }

}
