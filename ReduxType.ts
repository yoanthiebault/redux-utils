import {Action as ReduxAction} from "redux"

/* Action types */

export interface Action<T extends string> extends ReduxAction {
    type: T
}
export interface ActionWithPayload<T extends string, P> extends Action<T> {
    payload: P
}

export function createAction<T extends string>(type: T): Action<T>
export function createAction<T extends string, P>(type: T, payload: P): ActionWithPayload<T,P>
export function createAction<T extends string, P>(type: T, payload?: P) {
    return payload === undefined ? { type } : { type, payload }
}

/* Reducer types */

export interface ActionHandler<S,T extends string, A extends Action<T>> {
    (state: S, action: A): S
}

interface Handlers<S> {
    [actionType: string]: ActionHandler<S,any,any>
}

export const createReducer = <S, T extends string>(initialState: S, handlers: Handlers<S>) => {
    return (state = initialState, action: Action<T>): S => {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action)
        } else {
            return state
        }
    }
}