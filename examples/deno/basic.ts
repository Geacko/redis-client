#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({ 
    port: 6379 
}))

// send 'HELLO' with `send` and read the response with `read`
console.log(await db.send([ 'HELLO' , '3' ]).read())

db.close()
