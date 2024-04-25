import type {
    Command
} from './types.ts'

/** @internal */
export const EMPTY_BUFFER = new Uint8Array(0)

/** @internal */
export function isCmd(cmd: unknown) : cmd is Command {
    return cmd instanceof Array && typeof cmd[0] == `string`
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
