import {Dict} from "./Dict";

export module AsyncUtils {

    class ResultStore<V,R> {
        private results: any = {};
        private resultCount = 0;
        private gotError = false;

        constructor(
            private promises: Dict<Promise<V>>,
            private resolve: (result: R) => void,
            private reject: (err: any) => void
        ) {
            for (let label in promises) {
                promises[label].then(this.onSuccess.bind(this, label)).catch(this.onError)
            }
        }

        private onError = (err: any) => {
            this.gotError = true;
            this.reject(err)
        };

        private onSuccess = (label: string, r: V) => {
            if (this.gotError) {
                return
            }
            this.results[label] = r;
            this.resultCount += 1;
            if (this.resultCount === Object.keys(this.promises).length) {
                this.resolve(this.results)
            }
        }
    }

    export const parallel = <V>(functions: Dict<() => Promise<V>>): Promise<Dict<V>> => {
        return new Promise((resolve, reject) => {
            const promises: Dict<Promise<any>> = {};
            for (let label in functions) {
                promises[label] = functions[label]()
            }
            new ResultStore<V,Dict<V>>(promises, resolve, reject)
        })
    };

    const call = (func: () => Promise<void>, onSuccess, onError) => {
        func().then(onSuccess).catch(onError)
    };

    export const serie = (functions: (() => Promise<void>)[]): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (functions.length === 0) {
                resolve()
            }
            let cb = resolve;
            for (let i = functions.length - 1 ; i >= 0 ; i--) {
                cb = call.bind(null, functions[i], cb, reject)
            }
            cb()
        })
    }
}