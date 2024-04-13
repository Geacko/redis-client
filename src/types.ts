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
    | ReadableStreamProvider
    | ReadableStream<Uint8Array>

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
 *  UnderlyingConnection interface
 */
export interface UnderlyingConnection {
    
    /** 
     *  Readable stream linked 
     *  to the connection 
     */
    readonly readable: ReadableStream<Uint8Array>
    
    /** 
     *  Writable stream linked 
     *  to the connection 
     */
    readonly writable: WritableStream<Uint8Array>

    /**
     *  Close the connection
     */
    close(): void

}
