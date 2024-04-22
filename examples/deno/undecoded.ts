#! /usr/bin/env -S deno run --allow-net

import { Bulk } from "@geacko/resp3-parser";
import { 
    Client 
} from "../../mod.ts"

await using db = new Client(await Deno.connect({ port: 6379 }), {
    decodeBulk: false
})

db.send([ 'SET' , 'some-key', '> This is a simple test 😉 !' ])
db.send([ 'GET' , 'some-key' ])
db.send([ 'DEL' , 'some-key' ])

for (let i = 0; i < 3; i++) {
    
    db.read().then((x) => {
        console.log(x instanceof Bulk ? x.decode() : x)
    })

}
