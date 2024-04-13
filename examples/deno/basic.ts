#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

// send 'HELLO' with `send` and read the response with `repl`
console.log(await db.send([ 'HELLO' , '3' ]).repl())

db.close()
