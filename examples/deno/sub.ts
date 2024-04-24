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

db.send([ 'SUBSCRIBE' ,     
    'ch:0' , 
    'ch:1' , 
    'ch:2' ,
    'ch:3' ,
])

console.log(
    await db.readMany<Push<number>[]>(4)
)

let out

do {

    out = await db.read<Push<string>>()

    // ...
    // ...
    // ...

    console.log(out)

} while(
    out[2] != `QUIT`
)
