import {Replacer} from "./Replacer";


export module ImmutableUtils {

    export function insertItem<T>(array: T[], index: number, item: T): T[] {
        const newArray = array.slice();
        newArray.splice(index, 0, item);
        return newArray;
    }

    export function insertItems<T>(array: T[], index: number, items: T[]): T[] {
        const newArray = array.slice();
        newArray.splice(index, 0, ...items);
        return newArray;
    }

    export function removeItem<T>(array: T[], index: number): T[] {
        let newArray = array.slice();
        newArray.splice(index, 1);
        return newArray;
    }

    export function removeItems(array, indexes: number[]) {
        indexes = indexes.sort((a,b) => b-a);
        let newArray = array.slice();
        indexes.forEach(index => newArray.splice(index, 1));
        return newArray;
    }

    export function replaceItem<T>(array: T[], index: number, replacer: Replacer<T>): T[] {
        let newArray = array.slice();
        newArray[index] = replacer(newArray[index]);
        return newArray;
    }

}
