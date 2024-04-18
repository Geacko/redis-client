#! /usr/bin/env -S deno run --allow-net

import { 
    Client, type Command
} from "../../mod.ts"

function* cmds(
    a: number,
    b: number,
) {

    while (a < b) {
        yield [ 'PING' , a++ ] as Command
    }

}

const db = new Client(await Deno.connect({
    port: 6379
}))

// Send 1,000,000 'PING'
for (let i = 0; i < 100; i++) {
    
    db.send(cmds(
        (i + 0) * 10_000, 
        (i + 1) * 10_000,
    ))

}

await db.nop()

console.log(
    'COMPLETE >', db.commandCount
)

db.close()
