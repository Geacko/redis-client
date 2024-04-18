#! /usr/bin/env -S deno run --allow-net

import type { Hash } from "@geacko/resp3-parser"
import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

// send 'HELLO' with `send` and read the response with `read`
console.log(new Map(await db.send([ 'HELLO' , '3' ]).read<Hash>()))

db.close()
