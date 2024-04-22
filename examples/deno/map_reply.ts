#! /usr/bin/env -S deno run --allow-net

import { type Failure, Hash, Unordered } from "@geacko/resp3-parser";
import { 
    Client 
} from "../../mod.ts"

const db = new Client(await Deno.connect({ port: 6379 }), {

    // transform all replies
    map(x) {

        return x instanceof Hash      ? new Map(x) 
             : x instanceof Unordered ? new Set(x)
             : x
    
    }

})

console.log(await db.send([ 'HELLO' ,'3' ]).read<Map<string, unknown> | Failure>())

db.close()
