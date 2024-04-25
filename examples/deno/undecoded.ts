#! /usr/bin/env -S deno run --allow-net

import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({ port: 6379 }), {
    decodeBulk: false
})

db.send([ 'SET' , 'some-key', '> This is a simple test 😉 !' ])
db.send([ 'GET' , 'some-key' ])
db.send([ 'DEL' , 'some-key' ])

console.log(await db.readMany(3))
