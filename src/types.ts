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
export type CommandBatch = Iterable<Command> | ArrayLike<Command>

/**
 *  Duplex interface
 */
export interface Duplex {
    
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

}

/**
 *  Closable interface
 */
export interface Closable {

    /**
     *  Function called when the `close` method 
     *  of the `Client` instance encapsulating 
     *  the connection is called.
     */
    close(): void

}

/**
 *  Conn interface
 */
export type Conn = Duplex & Closable
