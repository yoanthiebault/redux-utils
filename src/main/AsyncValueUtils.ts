import {ReduxUtils} from "./ReduxUtils";

export interface AsyncValue<T> {
    value: T
    error: any
    loading: boolean
}

export module AsyncValueUtils {
    export const INITIAL_ASYNC_VALUE: AsyncValue<any> = {
        error: null,
        loading: false,
        value: null
    };


    export const createLoadActionCreator = <AT extends string>(actionType: AT) => {
        return () => ReduxUtils.createAction(actionType)
    };
    export const createSuccessActionCreator = <AT extends string,T>(actionType: AT) => {
        return (value: T) => ReduxUtils.createAction(actionType, value)
    };
    export const createErrorActionCreator = <AT extends string>(actionType: AT) => {
        return (error: any) => ReduxUtils.createAction(actionType, error)
    };


    export const createLoadReducer = <S>(attribute: keyof S) => {
        return (state: S, action) => {
            const newAsyncValue: AsyncValue<any> = {
                ...(state as any)[attribute],
                loading: true
            };
            return {
                ...(state as any),
                [attribute]: newAsyncValue
            }
        }
    };
    export const createSuccessReducer = <S extends Object>(attribute: keyof S) => {
        return (state: S, action: ReturnType<ReturnType<typeof createSuccessActionCreator>>) => {
            const newAsyncValue: AsyncValue<any> = {
                value: action.payload,
                error: null,
                loading: false
            };
            return {
                ...(state as any),
                [attribute]: newAsyncValue
            }
        }
    };
    export const createErrorReducer = <S extends Object>(attribute: keyof S) => {
        return (state: S, action) => {
            const newAsyncValue: AsyncValue<any> = {
                value: null,
                error: action.payload,
                loading: false
            };
            return {
                ...(state as any),
                [attribute]: newAsyncValue
            }
        }
    }
}
