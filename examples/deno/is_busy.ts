#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({
    port: 6379
}))

// exec writing process
db.send([ 'HELLO' , '3' ])

console.log(
    0, '- IS BUSY [WRITING] >' , db.isBusy
)

// waits for the command queue to finish
await db.nop()

console.log(
    1, '- IS BUSY [WRITING] >' , db.isBusy
) 

// exec reading process
db.read().then(() => console.log(
    3, '- IS BUSY [READING] >' , db.isBusy
))

console.log(
    2, '- IS BUSY [READING] >' , db.isBusy
)
