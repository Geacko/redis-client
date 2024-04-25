#! /usr/bin/env -S deno run --allow-net

import type { FormatedBulk } from "@geacko/resp3-parser";
import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({ 
    port: 6379 
}))

// switch protocol v2 -> v3
console.log(await db.send([ 'HELLO' , 3 ]).read())

// info as Verbatim string
const txt = await db.send([ 'INFO' , 'server' ]).read<FormatedBulk>()

console.log(txt)
console.log(txt.decode())
