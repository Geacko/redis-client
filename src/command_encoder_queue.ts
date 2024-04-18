import type { 
    Command
} from './types.ts'

import { 
    BlobComposer
} from './composer.ts'

import {
    computeByteCount,
    encode,
} from './utils.ts'

const enum Char {

    '*' = '*',
    '$' = '$',
    ';' = ';',
    'Ø' = '0',
    '?' = '?',
    '¶' = '\r\n',

}

/**
 *  @internal
 */
export class CommandEncoderQueue implements Iterator<Uint8Array, void> {

    /**
     *  Data composer.
     */
    private composer = new BlobComposer()

    /**
     *  Commands waiting to be encoded.
     */
    private commands = [
        // ...
    ] as Command[]

    /**
     *  Number of commands waiting to 
     *  be encoded.
     */
    get count() {
        return this.commands.length
    }

    /**
     *  Add new command to encode.
     *  @param cmd Command to add to the buffer.
     */
    add(cmd: Command) {
        this.commands.push(cmd)
    }

    /**
     *  Clear the queue
     */
    clear() {

        this.composer.clear()
        this.commands = [
            // ...
        ]
    
    }

    /**
     *  Flush the command buffer.
     *  @param max Maximum number of commands to remove from the buffer.
     */
    flush(max = Infinity) : Uint8Array | null {

        const commands = this.commands.splice(0, max)[Symbol.iterator]() as Iterator<Command, void>
        const composer = this.composer

        let end = ``
        let cmd ; while ((
            cmd = commands.next().value
        )) {

            const [
                x, ...xs
            ] = cmd
            
            end += Char[`*`] + cmd.length 
                +  Char[`¶`]

            const {
                length: s
            } = x

            // Note: We assume that the command name is 
            // an ASCII string
            end += Char[`$`] + s 
                +  Char[`¶`] + x
                +  Char[`¶`]

            for (let x of xs) {

                // We assume that `x` is relatively 
                // small (< 1024 bytes) 
                if (typeof x == `string`) {

                    if (x.length < 1024) {

                        end += Char[`$`] + computeByteCount(x)
                            +  Char[`¶`] + x
                            +  Char[`¶`]

                        continue

                    }

                    x = encode(x)

                }

                if (x instanceof Uint8Array) {

                    const {
                        byteLength: s
                    } = x
                    
                    end += Char[`$`] + s 
                        +  Char[`¶`]  
                        
                    composer.add(encode(end))
                    composer.add(x)
                    
                    end = Char[`¶`]
                    
                    continue
                
                }

                else {

                    const {
                        length: s
                    } = x + ``

                    end += Char[`$`] + s 
                        +  Char[`¶`] + x 
                        +  Char[`¶`]

                }

            }
            
        }

        // Note: `end` is empty only if there is 
        // nothing to return
        if (!end) {
            return null
        }

        // encode the tail
        composer.add(
            encode(end)
        )

        return composer.compose()

    }

    /**
     *  Implementation of the `Iterator` 
     *  protocol. Returns the next stream 
     *  to write.
     */
    next() : IteratorResult<Uint8Array, void> {

        // Note: Only 10,000 commands maximum at the time
        const x = this.flush(10_000) ??  void 0

        return x ? {
            done: !1, value: x
        } : {
            done: !0, value: x
        }

    }

}
