#! /usr/bin/env -S deno run --allow-net

import type {
    UnderlyingConnection, 
    Command
} from '../../mod.ts'

import { 
    Client
 } from '../../mod.ts'

import { 
    connect, type Socket
} from "node:net"

function createReadable(
    s: Socket
) {

    return new ReadableStream<Uint8Array>({
    
        pull(c) {

            return new Promise(ret => setTimeout(() => {

                const x = s.read()
                
                x &&
                c.enqueue(x)

                ret()

            }, 24))
        
        }

    })

}

function createWritable(
    s: Socket
) {
    
    return new WritableStream<Uint8Array>({
    
        write(chunk) {
            s.write(chunk)
        }

    })

}

function createConnection(
    opts : { port: number }
) : Promise<UnderlyingConnection> {

    return new Promise(ret => {

        const s = connect(opts, () => {
            
            ret(Object.freeze({
            
                readable: createReadable(s),
                writable: createWritable(s),
        
                close() {
                    s.destroy()
                }
        
            }))

        })

        s.pause()

    })

}

const db = new Client(await createConnection({ 
    port: 6379 
}))

// ----------------------------------------
// Test simple send
// ----------------------------------------
{

    console.log(await db.send([ 'HELLO' , '3' ]).repl())

}

// ----------------------------------------
// Test pipeline
// ----------------------------------------
{

    const cmds = function* () {

        for (let i = 0; i < 100; i++) {
            yield [ 'PING' , i ] as Command
        }
    
    }
    
    db.send(cmds())
    
    console.log(await Array.fromAsync(db))

}

// ----------------------------------------
// Test nop
// ----------------------------------------
{

    const cmds = function*(
        a: number,
        b: number,
    ) {
    
        while (a < b) {
            yield [ 'PING' , a++ ] as Command
        }
    
    }
    
    // Send 1,000,000 'PING'
    for (let i = 0; i < 100; i++) {
        
        db.send(cmds(
            (i + 0) * 10_000, 
            (i + 1) * 10_000,
        ))
    
    }

    await db.nop().then(() => {
        console.log('Complete !', db.commandReplyCount)
    })

}

db.close()
