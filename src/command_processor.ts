import type { 
    Command 
} from './types.ts'

import { 
    Resp3DecoderStream
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
     *  constructor
     *  @param readable Input stream 
     *  @param writable Output stream
     */
    constructor(
        readable: ReadableStream<Uint8Array>,
        writable: WritableStream<Uint8Array>,
    ) {

        const decode = new Resp3DecoderStream({
            useRecord     : true,
            useAttributes : true,
        })

        this.reader = readable.pipeThrough(decode).getReader()
        this.output = writable

    }

    /**
     *  Add new command to write.
     *  @param cmd Command to add to the queue.
     */
    add(cmd: Command) {

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
    
            await readable.pipeTo(output, {
                preventClose: true,
                preventAbort: true,
            })
    
        }

    }

    /**
     *  Reads the next available 
     *  response in the stream.
     */
    async read() {

        const {
            value: x
        } = await this.reader.read()
        
        this.count > 0 &&
        this.count--

        return x

    }

}
