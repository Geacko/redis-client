#! /usr/bin/env -S deno run --allow-net

import { Client, type Gateway } from '../../mod.ts'
import { createConnection, type Socket, type NetConnectOpts } from 'node:net'
import { Readable, Writable } from 'node:stream'

function connect(
    opts: NetConnectOpts
) {

    let s!: Socket

    // convert NodeJS net.Socket to Gateway type
    return new Promise<Gateway>(ret => (s = createConnection(opts, () => {
        
        s.pause()

        ret({

            readable: Readable.toWeb(s) as ReadableStream<Uint8Array>,
            writable: Writable.toWeb(s) as WritableStream<Uint8Array>,

            close() {
                s.destroy()
            }
        
        } as const)

    })))

}

function* cmds(
    a: number, 
    b: number
) {
    
    while (a < b) {
        yield [ 'PING' , a++ ] as const
    }

}

const db = new Client(await connect({
    port: 6379
}))

// switch protocol RESPv2 -> RESPv3
await db.send([ 'HELLO', '3' ]).read()

const chunksize = 10_000
const count     = 100

// send 100 batches of 10_000 'PING' each
for (let i = 0; i < count; i++) {
    
    db.send(cmds(
        (i + 0) * chunksize,
        (i + 1) * chunksize,
    ))

    console.log(
        await db.readMany(chunksize)
    )

}

db.close()
