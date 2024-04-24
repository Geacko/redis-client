import type { 
    Command,
    CommandArgument
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

    private encodeBatch(
        commands: Command[]
    ) {

        const {
            length: count
        } = commands

        let end = ``
        for (let i = 0; i < count; i++) {
            end = this.encodeCmd(commands[i]!, end)
        }

        return end

    }

    private encodeCmd(
        cmd: Command, end = ``
    ) {

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

        const {
            length: m
        } = xs

        for (let i = 0; i < m; i++) {
            end = this.encodeParameter(xs[i]!, end)
        }

        return end

    }

    private encodeParameter(
        x: CommandArgument, end = ``
    ) {

        if (typeof x == `string`) {

            if (x.length < 1024) {

                return end 
                     + Char[`$`] + computeByteCount(x)
                     + Char[`¶`] + x
                     + Char[`¶`]

            }

            x = encode(x)

        }

        if (x instanceof Uint8Array) {

            const {
                byteLength: s
            } = x
                
            this.composer.add(encode(end + Char['$'] + s + Char['¶']))
            this.composer.add(x)
            
            return Char[`¶`]
        
        }

        else {

            x = `` + x

            return end 
                 + Char[`$`] + x.length 
                 + Char[`¶`] + x 
                 + Char[`¶`]

        }

    }

    /**
     *  Flush the command buffer.
     */
    flush(max = Infinity) : Uint8Array | null {

        const {
            count
        } = this

        max = Math.min(max, count)

        if (max <= 0) {
            return null
        }

        const commands = this.commands
        const composer = this.composer

        composer.add(encode(
            count == 1 ? this.encodeCmd(commands.pop()!) : this.encodeBatch(commands.splice(0, max))
        ))

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
