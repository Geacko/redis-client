#! /usr/bin/env -S deno run --allow-net --allow-read

import { Resp3Parser } from '@geacko/resp3-parser'
import { StreamHandler } from "../../mod.ts"

function createHandler() {

    const EMPTY_BUFFER = new Uint8Array(0)

    const par = new Resp3Parser()
    const enc = new TextEncoder()

    // incomming commands
    const commands = [
        // ...
    ] as string[][]

    const readable = new ReadableStream<Uint8Array>({

        pull : ctr => {
    
            return new Promise(ret => setTimeout(() => {

                let command ; while ((
                    command = commands.shift()
                )) {

                    const [
                        k, x = 'PONG'
                    ] = command

                    if (k != 'PING') {
                        
                        ctr.enqueue(enc.encode(
                            `-Error: Command "${k}" not recognized\r\n`
                        ))

                    } 
                    
                    else {

                        ctr.enqueue(enc.encode(
                            '+' + x + '\r\n'
                        ))

                    }

                }

                // force the wait
                ctr.enqueue(EMPTY_BUFFER)

                ret()

            }, 24))
    
        }
    
    })

    const writable = new WritableStream<Uint8Array>({
    
        write : chunk => {

            par.appendChunk(chunk)
            
            let command
            while (par.remainingBytes > 0) {
                void 0 !== (command = par.process<string[]>()) && commands.push(command)
            }
    
        }
    
    })  

    return new StreamHandler(
        readable,
        writable
    )

}

const db = createHandler()

// test simple send
console.log(await db.send([ 
    'PING' , 'Some test...' 
]).repl())

// test pipeline
db.send([
    [ 'PING' , '0' ],
    [ 'PING' , '1' ],
    [ 'PING' , '2' ],
    [ 'PING' , '3' ],
])

for await (const x of db as AsyncIterable<string>) {
    console.log(+x)
}

// test streamed command argument
console.log(await Array.fromAsync(db.send([
    ['PING', Deno.openSync('examples/lorem_ipsum.txt').readable],
])))
