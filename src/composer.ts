import { 
    EMPTY_BUFFER 
} from "./utils.ts"

function sum(
    a: number,
    x: Uint8Array
) {

    return a + x.byteLength

}

/** 
 * @internal 
 */
export class BlobComposer {

    /**
     *  blob parts
     */
    private parts = [
        // ...
    ] as Uint8Array[]

    /**
     *  size of the blob in bytes
     */
    get size() {
        return this.parts.reduce(sum, 0)
    }

    /**
     *  Number of parts
     */
    get count() {
        return this.parts.length
    }

    /**
     *  add new component
     */
    add(part: Uint8Array) {
        this.parts.push(part)
    }

    /**
     *  reset the composer
     */
    clear() {
        
        this.parts = [
            // ...
        ]

    }

    /**
     *  flush
     */
    compose() : Uint8Array {

        const {
            count
        } = this

        if (count == 1) {
            return this.parts.pop()!
        }

        if (count == 0) {
            return EMPTY_BUFFER
        }

        const out = new Uint8Array(this.size)

        let i = 0
        for (const x of this.parts) {
            out.set(x, i); i += x.byteLength
        }

        this.parts = [
            // ...
        ]

        return out

    }

}
