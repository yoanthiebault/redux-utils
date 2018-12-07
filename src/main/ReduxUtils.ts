import {Action as ReduxAction, Reducer} from "redux"

/* Action interfaces */

export interface Action<T extends string> extends ReduxAction<T> {

}

export interface ActionWithPayload<T extends string, P> extends Action<T> {
    payload: P
}

/* Reducer interfaces */

interface Reducers<S> {
    [actionType: string]: Reducer<S, Action<any>>
}

/* Utils */

export module ReduxUtils {

    export function createAction<T extends string>(type: T): Action<T>
    export function createAction<T extends string, P>(type: T, payload: P): ActionWithPayload<T, P>
    export function createAction<T extends string, P>(type: T, payload?: P) {
        return payload === undefined ? {type} : {type, payload}
    }

    export class RootReducerManager {
        private initialStates: { [stateLabel: string]: any } = {};
        private reducers: { [stateLabel: string]: Reducers<any> } = {};

        public setInitialState<S>(stateLabel: string, initialState: S): void {
            this.initialStates[stateLabel] = initialState
        }

        public addReducer<S, T extends string>(stateLabel: string, actionType: T, reducer: Reducer<S, Action<T>>): void {
            this.reducers[stateLabel][actionType] = reducer
        }

        private reduce<S, T extends string>(stateLabel: string, state: S, action: Action<T>): S {
            if (state === undefined) {
                return this.initialStates[stateLabel]
            }

            const reducers = this.reducers[stateLabel];
            if (!reducers.hasOwnProperty(action.type)) {
                return state
            }

            return reducers[action.type](state, action)
        }

        private reduceRoot(rootState = {}, action: Action<any>) {
            const stateLabels = Object.keys(this.reducers);

            let hasChanged = false;
            const nextRootState = stateLabels.reduce((nextRootState, stateLabel) => {
                const previousState = rootState[stateLabel];
                const nextState = this.reduce(stateLabel, previousState, action);
                if (typeof nextState === 'undefined') {
                    throw new Error(`Got undefined next state "${stateLabel}"`)
                }
                nextRootState[stateLabel] = nextState;
                hasChanged = hasChanged || previousState !== nextState;
                return nextRootState
            }, {});

            return hasChanged ? nextRootState : rootState
        }

        public getRootReducer(): Reducer<any, Action<any>> {
            return this.reduceRoot.bind(this)
        }
    }
}

