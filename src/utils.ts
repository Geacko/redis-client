import type {
    Command,
    ReadableStreamProvider
} from './types.ts'

/** @internal */
export function isCmd(cmd: unknown) : cmd is Command {
    return cmd instanceof Array && typeof cmd[0] == `string`
}

/** @internal */
export function isReadableStreamProvider(x: unknown) : x is ReadableStreamProvider {
    return typeof (x as { stream: unknown }).stream == 'function'
}

/** @internal */
export const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

/** @internal */
export function computeByteCount(s: string) {
    
    let i = s.length
    let m = i
    let x = 0
    
    while (i-- > 0) {

        x = s.charCodeAt(i)

        if (x <= 0x007F) {
            continue
        }

        if (x <= 0x07FF) {
            m += 1
            continue
        }

        m += 2

        if (x >= 0xDC00 && 
            x <= 0xDFFF) {
            i -= 1
        }

    }

    return m

}

/** @internal */
export function clampedFromAsyncLike<T extends Array<unknown>>(
    a: number, x: number, b: number, map: () => Promise<unknown>
) {

    return Promise.all(Array.from({ length: Math.min(Math.max(a, x), b) } , map)) as Promise<T>

}