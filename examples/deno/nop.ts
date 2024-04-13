#! /usr/bin/env -S deno run --allow-net

import { 
    Client, type Command
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

function* cmds(
    a: number,
    b: number,
) {

    while (a < b) {
        yield [ 'PING' , a++ ] as Command
    }

}

// Send 1,000,000 'PING'
for (let i = 0; i < 1_000; i++) {
    
    db.send(cmds(
        (i + 0) * 1_000, 
        (i + 1) * 1_000,
    ))

}

await db.nop().then(() => {
    console.log('Complete !', db.commandReplyCount)
})

db.close()
