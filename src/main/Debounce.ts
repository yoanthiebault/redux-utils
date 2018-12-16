export type Procedure = (...args: any[]) => void;

export const debounce = <F extends Procedure>(fn: F, delay: number): F => {
    let timer: number = null
    return ((...args: any[]) => {
        const context = this
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(context, args), delay)
    }) as any
}