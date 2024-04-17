import type { 
    Command 
} from './types.ts'

import { 
    Resp3DecoderStream,
    Push
} from '@geacko/resp3-parser'

import { 
    CommandEncoderQueue 
} from './command_encoder_queue.ts'

/** 
 *  @internal 
 */
export class CommandProcessor {
    
    /**
     *  Writable stream.
     */
    private output

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
     *  Number of replies available for 
     *  reading.
     */
    private count = 0

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
     *  Number of replies available for 
     *  reading.
     */
    get commandReplyCount() {
        return this.count
    }

    /**
     *  Returns `true` if the writing process 
     *  is in progress. `false` otherwise.
     */
    get isWriting() {
        return this.currentProcess instanceof Promise
    }

    /**
     *  Returns `true` if processor is closed.
     */
    get isClosed() : boolean {
        return this.closed
    }

    /**
     *  constructor
     *  @param readable Input stream 
     *  @param writable Output stream
     */
    constructor(
        readable: ReadableStream<Uint8Array>,
        writable: WritableStream<Uint8Array>,
    ) {

        this.reader = readable.pipeThrough(new Resp3DecoderStream()).getReader()
        this.output = writable

    }

    /**
     *  Add new command to write.
     *  @param cmd Command to add to the queue.
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

        return this.currentProcess ??= this.processInternal().then(() => {
               this.currentProcess = void 0
        })
    
    }

    /**
     *  Writes all available data to the stream.
     */
    private async processInternal() {

        const {
            queue, output
        } = this

        let readable ; while ((
            readable = queue.next().value
        )) {
    
            this.closed || await readable.pipeTo(output, {
                preventClose: true,
                preventAbort: true,
            })
    
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

        const {
            value: x
        } = await this.reader.read()

        // ignore it
        if (x instanceof Push) {
            return x
        }
        
        this.count > 0 &&
        this.count--

        return x

    }

    /**
     *  Makes all future read and write 
     *  operations impossible.\
     *  Note: Does not close underlying streams.
     */
    close() {

        // clear state
        this.count          = 0
        this.currentProcess = void 0
        this.closed         = true
        this.queue.clear()
            
    }

}
