#! /usr/bin/env -S deno run --allow-net

import { 
    Client
} from "../../mod.ts"

function* cmds(
    a: number, 
    b: number
) {
    
    while (a < b) {
        yield [ 'PING' , a++ ] as const
    }

}

const db = new Client(await Deno.connect({
    port: 6379
}))

// send 100 batches of 10_000 'PING' each
for (let i = 0; i < 100; i++) {

    console.log(await db.send(cmds(
        (i + 0) * 10_000,
        (i + 1) * 10_000,
    )).readall())

}

db.close()
