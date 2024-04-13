import type { 
    UnderlyingConnection
} from "./types.ts"

import { 
    StreamHandler
} from "./stream_handler.ts"

/**
 *  Client class.
 */
export class Client extends StreamHandler implements Disposable, AsyncDisposable {

    /**
     *  connection
     */
    #conn: UnderlyingConnection

    /**
     *  Client constructor.
     *  @param connection The underlying connection
     */
    constructor(
        connection: UnderlyingConnection
    ) {

        super(
            connection.readable,
            connection.writable,
        )

        this.#conn = connection
    
    }

    /**
     *  Close the connection.
     */
    close() {
        this.#conn.close()
    }

    /**
     *  Close the connection. 
     *  Implementation of the `Disposable`
     *  protocol.
     */
    [Symbol.dispose]() : void {
        return this.close()
    }

    /**
     *  Close the connection asynchronously. 
     *  Implementation of the `Disposable`
     *  protocol.
     */
    async [Symbol.asyncDispose]() : Promise<void> {
        return await this.nop().then(() => this.close())
    }

}
