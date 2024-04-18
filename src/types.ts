/**
 *  Command argument type
 */
export type CommandArgument
    = string 
    | number 
    | bigint
    | Uint8Array

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
