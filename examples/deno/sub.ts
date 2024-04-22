#! /usr/bin/env -S deno run --allow-net

import type { Push } from "@geacko/resp3-parser"
import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({ 
    port: 6379 
}))

console.log(await db.send([ 'HELLO' , '3' ]).read())

db.send([ 'SUBSCRIBE' , 
    'ch:0' , 
    'ch:1' , 
    'ch:2' ,
    'ch:3' ,
])

let out

do {

    out = await db.read<Push>()

    // ...
    // ...
    // ...

    console.log(out)

} while(!(
    out[2] == `QUIT`
))
