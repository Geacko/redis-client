#! /usr/bin/env -S deno run --allow-net

import { 
    Client
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

const count = 10_000

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

// ----------------------------------------
// Pipeline using an array of commands
// ----------------------------------------
{

    const cmds = Array.from({ length : count }, (_, i) => {
        return [ 'PING' , i ] as const
    })

    db.send(cmds)

    console.log(
        await db.readMany(count)
    )

}
// ----------------------------------------

// ----------------------------------------
// Pipeline using `ArrayLike` with mapfn
// ----------------------------------------
{

    db.send({ length: count }, (_, m) => {
        return [ 'PING', 2 * count + m ]
    })

    console.log(
        await db.readMany(count)
    )

}
// ----------------------------------------

// ----------------------------------------
// Pipeline using `Generator`
// ----------------------------------------
{

    const cmds = function* (
        a: number,
        b: number
    ) {

        while (a < b) {
            yield [ 'PING' , a++ ] as const
        }
    
    }

    db.send(cmds(
        3 * count,
        4 * count
    ))

    console.log(
        await db.readMany(count)
    )

}
// ----------------------------------------

db.close()
