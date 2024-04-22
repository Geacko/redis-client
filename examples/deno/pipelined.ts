#! /usr/bin/env -S deno run --allow-net

import { 
    Client, type Command
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

const count = 10_000

// ----------------------------------------
// Pipeline using an array of commands
// ----------------------------------------
{

    db.send(Array.from({ length : count }, (_, i) => {
        return [ 'PING' , i ] as Command
    }))

    console.log(
        await db.readMany(count)
    )

}

// ----------------------------------------
// Pipeline using `send` multiple times
// ----------------------------------------
{

    for (let i = count; i < 2 * count; i++) {
        db.send([ 'PING' , i ])
    }

    console.log(
        await db.readMany(count)
    )

}

// ----------------------------------------
// Pipeline using `Generator`
// ----------------------------------------
{

    const cmds = function* (
        a: number,
        b: number
    ) {

        while (a < b) {
            yield [ 'PING' , a++ ] as Command
        }
    
    }

    db.send(cmds(
        2 * count,
        3 * count
    ))

    console.log(
        await db.readMany(count)
    )

}

db.close()
