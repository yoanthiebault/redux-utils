export * from "./AsyncValueUtils"
export * from "./ImmutableUtils"
export * from "./ReduxUtils"

export function classname(...args: string[]): string {
    return args.filter(arg => arg).join(" ");
}

export function propertyOf<TObj>(name: keyof TObj): string {
  return name;
}
