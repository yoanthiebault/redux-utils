export function classname(...args: string[]): string {
    return args.filter(arg => arg).join(" ");
}