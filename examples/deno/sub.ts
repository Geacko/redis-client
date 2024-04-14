#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

console.log(await db.send([ 'HELLO' , '3' ]).read())

console.log(await db.send([ 
    'SUBSCRIBE' , 'my_channel_name' 
]).read())

let out

while(1) {

    console.log('receive >', out = await db.read<string[]>())

    if (out instanceof Error || out[2] == `QUIT`) {
        break
    }

}

db.close()
