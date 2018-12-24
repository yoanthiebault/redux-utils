import {Replacer} from "./Replacer";

export type PathElement = string | number
export interface Path extends Array<PathElement> {}

export const propertyOf = <TObj>(name: keyof TObj) => name;

export module PathUtils {

    function create<T, U1 extends keyof T>(v: T, t1: U1): Path
    function create<T, U1 extends keyof T, U2 extends keyof T[U1]>(v: T, t1: U1, t2: U2): Path
    function create<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2]>(v: T, t1: U1, t2: U2, t3: U3): Path
    function create<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2], U4 extends keyof T[U1][U2][U3]>(v: T, t1: U1, t2: U2, t3: U3, t4: U4): Path
    function create<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2], U4 extends keyof T[U1][U2][U3]>(v: T, t1: U1, t2?: U2, t3?: U3, t4?: U4): Path {
        if (t4) {
            return [t1 as PathElement, t2 as PathElement, t3 as PathElement, t4 as PathElement]
        }
        if (t3) {
            return [t1 as PathElement, t2 as PathElement, t3 as PathElement]
        }
        if (t2) {
            return [t1 as PathElement, t2 as PathElement]
        }
        return [t1 as PathElement]
    }

    interface Editer<T> {
        (replacer: Replacer<T>):  void
    }
    
    export function transform<T, U1 extends keyof T>(edit: Editer<T>, t1: U1): Editer<T[U1]>
    export function transform<T, U1 extends keyof T, U2 extends keyof T[U1]>(edit: Editer<T>, t1: U1, t2: U2): Editer<T[U1][U2]>
    export function transform<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2]>(edit: Editer<T>, t1: U1, t2: U2, t3: U3): Editer<T[U1][U2][U3]>
    export function transform<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2], U4 extends keyof T[U1][U2][U3]>(edit: Editer<T>, t1: U1, t2: U2, t3: U3, t4: U4): Editer<T[U1][U2][U3][U4]>
    export function transform<T, U1 extends keyof T, U2 extends keyof T[U1], U3 extends keyof T[U1][U2], U4 extends keyof T[U1][U2][U3]>(edit: Editer<T>, t1: U1, t2?: U2, t3?: U3, t4?: U4): Editer<T[U1][U2][U3][U4]> { 
        return (replacer) => {
            edit((previousElement) => replace(previousElement, create(null as T, t1, t2, t3, t4), replacer))
        }
    }


    export const equals = (a: Path, b: Path): boolean => {
        if (!a && !b) {
            return true
        }
        if (!a || !b || a.length != b.length) {
            return false
        }
        return a.every((val, index) => val == b[index])
    };

    export const startWith = (longPath: Path, start: Path): boolean => {
        if (!longPath || !start || longPath.length < start.length) {
            return false
        }
        return start.every((val, index) => val == longPath[index])
    };

    export const endWith = (longPath: Path, end: Path): boolean => {
        if (!longPath || !end || longPath.length < end.length) {
            return false
        }
        const offset = longPath.length - end.length;
        return end.every((val, index) => val == longPath[index + offset])
    };

    export const extract = <T,R>(obj: T, path: Path): R => {
        let result = obj as any;
        for (let p of path) {
            result = result[p];
        }
        return result as R
    };

    export const replace = <T,R>(obj: T, path: Path, replace: (itemToReplace: R) => R): T => {
        return internalReplaceFromPath<R>(obj, path, replace)
    };

    const internalReplaceFromPath = <R>(obj: any, path: Path, replace: (itemToReplace: R) => R): any => {
        if (path.length === 0) {
            return replace(obj as R);
        }
        const child = internalReplaceFromPath<R>(obj[path[0]], path.slice(1), replace);
        if (child === obj[path[0]]) {
            return obj
        }
        if (Array.isArray(obj)) {
            const newArray = obj.slice();
            newArray[path[0]] = child;
            return newArray
        }
        return (obj as any).copy
            ? (obj as any).copy({[path[0]]: child})
            : {
                ...obj,
                [path[0]]: child
            };
    }
}
