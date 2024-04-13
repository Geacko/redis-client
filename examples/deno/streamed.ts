#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

console.log(await db.send([ 'HELLO' , '3' ]).repl())

const count     = 50
const chunksize = 10
const size      = count * chunksize

const chunk = new Uint8Array(Array.from({ length : chunksize }, (_, i) => 
    0x30 + (i % 10)
))

// create a blob like
const blob = {

    size,
    
    stream() {

        let i = count

        return new ReadableStream({
            
            pull(ctr) {

                if (i--) {
                    ctr.enqueue(chunk)
                } else {
                    ctr.close()
                }
            
            }

        })

    }
}

console.log(await db.send([ 'PING' , blob ]).repl())

db.close()
