export * from "./AsyncValueUtils"
export * from "./ImmutableUtils"
export * from "./ReduxUtils"

export function classname(...args: string[]): string {
    return args.filter(arg => arg).join(" ");
}

export function propertyOf<TObj>(name: keyof TObj): keyof TObj {
  return name;
}

export interface Dict<T> {
    [key: string]: T
}
