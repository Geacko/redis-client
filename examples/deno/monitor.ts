#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({ 
    port: 6379 
}))

db.closed.then(() => {
    console.log('CLOSED')
})

// "OK"
console.log(await db.send([ 'MONITOR' ]).read())

while (1) {

    const out = await db.read<string | undefined>()

    if (out === void 0) {
        break
    }

    // ...
    // ...
    // ...

    console.log(out)

}
