#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

console.log(await db.send([ 'HELLO' , '3' ]).repl())

console.log(await db.send([ 
    'SUBSCRIBE' , 'my_channel_name' 
]).repl())

let out

while(1) {

    console.log('recaive >', out = await db.repl<string[]>())

    if (out instanceof Error || out[2] == `QUIT`) {
        break
    }

}

db.close()
