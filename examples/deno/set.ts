#! /usr/bin/env -S deno run --allow-net

import { Failure, type Hash } from "@geacko/resp3-parser"
import { 
    Client
} from "../../mod.ts"

using db = new Client(await Deno.connect({
    port: 6379
}))

// switch protocol RESP v2 -> RESP v3
const hi = await db.send([ 
    'HELLO' , 3 
]).read<Hash | Failure>()

// Oops
if (hi instanceof Failure) {
    throw '😵'
}

console.log(hi)

db.send([ 'SET' , 'some-key', '> This is a simple test 😉 !' ])
db.send([ 'GET' , 'some-key' ])
db.send([ 'DEL' , 'some-key' ])

// read all responses
for await (const x of db) {
    console.log(x)
}
