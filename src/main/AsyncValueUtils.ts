import {Action, ReduxUtils} from "./ReduxUtils";
import {ThunkAction} from "redux-thunk";

export interface AsyncValue<T> {
    value: T
    error: any
    loading: boolean
}

type Unpack<T> = T extends AsyncValue<infer U> ? U : never

export module AsyncValueUtils {
    import RootReducerManager = ReduxUtils.RootReducerManager;
    export const INITIAL_ASYNC_VALUE: AsyncValue<any> = {
        error: null,
        loading: false,
        value: null
    };

    const createLoadActionCreator = <AT extends string>(actionType: AT) => {
        return () => ReduxUtils.createAction(actionType)
    };
    const createLoadReducer = <S>(attribute: keyof S) => {
        return (state: S): S => {
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
    const registerLoadAction = <ST, SL extends keyof ST, AT extends string>(
        rootReducerManager: RootReducerManager,
        stateLabel: SL & string,
        stateAttribute: keyof ST[SL],
        actionType: AT) => {
        const loadActionCreator = createLoadActionCreator(actionType);
        const reducer = createLoadReducer<ST[SL]>(stateAttribute);
        rootReducerManager.addReducer<ST, SL, any>(stateLabel, actionType, reducer);
        return loadActionCreator
    };


    const createSuccessActionCreator = <AT extends string, T>(actionType: AT) => {
        return (value: T) => ReduxUtils.createAction(actionType, value)
    };
    const createSuccessReducer = <S>(attribute: keyof S) => {
        return (state: S, action: ReturnType<ReturnType<typeof createSuccessActionCreator>>): S => {
            const newAsyncValue: AsyncValue<any> = {
                value: action.payload,
                error: null,
                loading: false
            };
            return {
                ...state as any,
                [attribute]: newAsyncValue
            }
        }
    };
    const registerSuccessAction = <ST, SL extends keyof ST & string, SA extends keyof ST[SL], V extends Unpack<ST[SL][SA]>, AT extends string>(
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        actionType: AT) => {
        const successActionCreator = createSuccessActionCreator<AT, V>(actionType);
        const reducer = createSuccessReducer<ST[SL]>(stateAttribute);
        rootReducerManager.addReducer<ST, SL, any>(stateLabel, actionType, reducer);
        return successActionCreator
    };


    const createErrorActionCreator = <AT extends string>(actionType: AT) => {
        return (error: any) => ReduxUtils.createAction(actionType, error)
    };
    const createErrorReducer = <S extends Object>(attribute: keyof S) => {
        return (state: S, action): S => {
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
    };
    const registerErrorAction = <ST, SL extends keyof ST & string, SA extends keyof ST[SL], AT extends string>(
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        actionType: AT) => {
        const errorActionCreator = createErrorActionCreator(actionType);
        const reducer = createErrorReducer<ST[SL]>(stateAttribute);
        rootReducerManager.addReducer<ST, SL, any>(stateLabel, actionType, reducer);
        return errorActionCreator
    };

    export const registerActionCreators = <ST, SL extends keyof ST & string, SA extends keyof ST[SL], V extends Unpack<ST[SL][SA]>, LAT extends string, SAT extends string, EAT extends string>(
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        loadActionType: LAT,
        successActionType: SAT,
        errorActionType: EAT) => {
        // rootReducerManager.setInitialState(stateLabel, INITIAL_ASYNC_VALUE);
        return {
            loadActionCreator: registerLoadAction<ST, SL, LAT>(rootReducerManager, stateLabel, stateAttribute, loadActionType),
            successActionCreator: registerSuccessAction<ST, SL, SA, V, SAT>(rootReducerManager, stateLabel, stateAttribute, successActionType),
            errorActionCreator: registerErrorAction<ST, SL, SA, EAT>(rootReducerManager, stateLabel, stateAttribute, errorActionType),
        }
    };

    export const registerThunkActionCreator = <ST, SL extends keyof ST & string, SA extends keyof ST[SL], V extends Unpack<ST[SL][SA]>, U extends any[]>(
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        actionPrefix: string,
        asyncFunction: (rootState: ST, ...args: U) => Promise<V>): (...args: U) => ThunkAction<void, ST, void, Action<any>> => {
        const {
            loadActionCreator,
            successActionCreator,
            errorActionCreator
        } = registerActionCreators<ST,SL,SA,V,string,string,string>(rootReducerManager, stateLabel, stateAttribute,
            actionPrefix + "/load",
            actionPrefix + "/success",
            actionPrefix + "/error");

        return (...args) => (dispatch, getRootState) => {
            dispatch(loadActionCreator());
            asyncFunction(getRootState(), ...args)
                .then(value => dispatch(successActionCreator(value)))
                .then(err => dispatch(errorActionCreator(err)))
        }
    }
}
