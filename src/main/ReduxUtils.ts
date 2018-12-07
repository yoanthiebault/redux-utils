import {Action as ReduxAction, Reducer} from "redux"

/* Action interfaces */

export interface Action<T extends string> extends ReduxAction<T> {

}
export interface ActionWithPayload<T extends string, P> extends Action<T> {
    payload: P
}

/* Reducer interfaces */

interface Reducers<S> {
    [actionType: string]: Reducer<S,Action<any>>
}

/* Utils */

export module ReduxUtils {

    export function createAction<T extends string>(type: T): Action<T>
    export function createAction<T extends string, P>(type: T, payload: P): ActionWithPayload<T,P>
    export function createAction<T extends string, P>(type: T, payload?: P) {
        return payload === undefined ? { type } : { type, payload }
    }

    export const createReducer = <S, T extends string>(initialState: S, reducers: Reducers<S>) => {
        return (state = initialState, action: Action<T>): S => {
            if (reducers.hasOwnProperty(action.type)) {
                return reducers[action.type](state, action)
            } else {
                return state
            }
        }
    };

    export class RootReducerManager {

    }
}

