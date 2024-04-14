/**
 *  ReadableStreamProvider interface representing 
 *  a Blob-like object.
 */
export interface ReadableStreamProvider {

    /**
     *  data size in bytes
     */
    readonly size: number

    /** 
     *  provides the ReadableStream associated 
     *  with the data 
     */
    stream(
        // void
    ) : ReadableStream<Uint8Array>

}

/**
 *  Command argument type
 */
export type CommandArgument
    = string 
    | number 
    | bigint 
    | Uint8Array
    | ReadableStream<Uint8Array>
    | ReadableStreamProvider

/**
 *  Command type
 */
export type Command = readonly [ 
    string , ...CommandArgument[]
]

/**
 *  Command batch type
 */
export type CommandBatch 
    = Parameters<typeof Array.from<Command>>[0]

/**
 *  Connection interface
 */
export interface Connection {
    
    /** 
     *  Readable stream linked to the 
     *  connection 
     */
    readonly readable: ReadableStream<Uint8Array>
    
    /** 
     *  Writable stream linked to the 
     *  connection 
     */
    readonly writable: WritableStream<Uint8Array>

    /**
     *  Function called when the `close` method 
     *  of the `Client` instance encapsulating 
     *  the connection is called.
     */
    close(): void

}
