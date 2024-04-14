#! /usr/bin/env -S deno run --allow-net

import { 
    Client, type Command
} from "../../mod.ts"

const db = new Client(await Deno.connect({
    port: 6379
}))

// ----------------------------------------
// Pipeline using `send` multiple times
// ----------------------------------------
{

    for (let i = 0; i < 100; i++) {
        db.send([ 'PING' , i ])
    }
    
    // read all replies
    console.log(await db.readall())

}

// ----------------------------------------
// Pipeline using an array of commands
// ----------------------------------------
{

    // create batch
    const batch = Array.from({ length : 100 }, (_, i) => {
        return [ 'PING' , i ] as Command
    })
    
    // send & read all replies
    console.log(await db.send(batch).readall())

}

// ----------------------------------------
// Pipeline using `Generator`
// ----------------------------------------
{

    const cmds = function* () {

        for (let i = 0; i < 100; i++) {
            yield [ 'PING' , i ] as Command
        }
    
    }
    
    // send & read all replies
    console.log(await db.send(cmds()).readall())

}

db.close()
