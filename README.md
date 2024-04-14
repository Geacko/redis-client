# redis-client
Simple cross-platform Redis client (RESPv2/v3)

**Example with Deno**

```ts

// create client
await using db = new Client(await Deno.connect({
    port: 6379
}))

// switch protocol RESPv2 -> RESPv3
console.log(
    await db.send([ 'HELLO' , '3' ]).read()
)

function* cmds() {

    for (let i = 0; i < 10_000; i++) {
        yield [ 'PING' , i ] as const
    }
    
}
    
// send 10,000 'PING'
db.send(cmds())
    
// read all replies
console.log(
    await db.readall()
)
```

**Example with Node**

```ts

function connect(
    opts: NetConnectOpts
) {

    let s!: Socket

    // convert NodeJS net.Socket to Connection type
    return new Promise<Connection>(ret => (s = createConnection(opts, () => {
        
        s.pause()

        ret({

            readable: Readable.toWeb(s) as ReadableStream<Uint8Array>,
            writable: Writable.toWeb(s) as WritableStream<Uint8Array>,

            close() {
                s.destroy()
            }
        
        })

    })))

}

// create client
await using db = new Client(await connect({
    port: 6379
}))

// switch protocol RESPv2 -> RESPv3
console.log(
    await db.send([ 'HELLO' , '3' ]).read()
)

function* cmds() {

    for (let i = 0; i < 10_000; i++) {
        yield [ 'PING' , i ] as const
    }
    
}
    
// send 10,000 'PING'
db.send(cmds())
    
// read all replies
console.log(
    await db.readall()
)
```
