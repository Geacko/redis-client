type Composable = Uint8Array | ReadableStream<Uint8Array>

function createNext(
    i: Iterator<Uint8Array | ReadableStream<Uint8Array>, void>
) {

    // initialize current iterator
    let c = i as typeof i | AsyncIterator<Uint8Array, void> | undefined

    return async () : Promise<IteratorResult<Uint8Array, void>> => {
            
        // until current iterator is not `undefined`
        while (c) {

            let r = c.next()

            if (r instanceof Promise) {
                r = await r
            }

            const {
                value: x
            } = r

            // end of the current iterator
            if (x === void 0) {

                // if current iterator == main iterator -> end
                // else -> go back to the main iterator
                c = i == c ? void 0
                  : i

                continue

            }

            // if current value is a ReadableStream -> delegate
            if (x instanceof ReadableStream) {

                c = x[Symbol.asyncIterator]()
                continue
            
            }

            // yield
            return { 
                value: x
            }

        }

        // end
        return { 
            done: true, value: void 0
        }

    }

}

/** 
 * @internal 
 */
export class Composer {

    /**
     *  writable components
     */
    private components = [
        // ...
    ] as Composable[]

    /**
     *  add new component
     */
    add(component: Composable) {
        this.components.push(component)
    }

    /**
     *  flush & create a new Iterator
     */
    compose() : ReadableStream<Uint8Array> | null {
        
        const xs = this.components.splice(0)
        const {
            length: count
        } = xs

        if (count == 0) {
            return null
        }

        if (count >= 2) {

            return ReadableStream.from({

                [Symbol.asyncIterator]() {
    
                    return { 
                        next: createNext(xs[Symbol.iterator]()) 
                    }
                
                }
    
            })

        }

        const x = xs[0]

        if (x instanceof Uint8Array) {
            return ReadableStream.from([ x ])
        }

        return x

    }

}
