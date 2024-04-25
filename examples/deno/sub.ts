#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

type Push<T> = [ 
    string , string , T 
]

await using db = new Client(await Deno.connect({ 
    port: 6379 
}))

db.closed.then(() => {
    console.log('CLOSED')
})

db.send([ 'SUBSCRIBE' ,     
    'ch:0' , 
    'ch:1' , 
    'ch:2' ,
    'ch:3' ,
])

console.log(
    await db.readMany<Push<number>[]>(4)
)

while (1) {

    const out = await db.read<Push<string> | undefined>()

    // stop if the connection is closed or if
    // receive a `QUIT` 
    if (out === void 0 || out[2] == `QUIT`) {
        break
    }

    // ...
    // ...
    // ...

    console.log(out)

}
