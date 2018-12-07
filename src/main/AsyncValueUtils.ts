import {Action, ReduxUtils} from "./ReduxUtils";
import {ThunkAction} from "redux-thunk";

export interface AsyncValue<T> {
    value: T
    error: any
    loading: boolean
}

export module AsyncValueUtils {
    import RootReducerManager = ReduxUtils.RootReducerManager;
    const INITIAL_ASYNC_VALUE: AsyncValue<any> = {
        error: null,
        loading: false,
        value: null
    };

    const createLoadActionCreator = <AT extends string>(actionType: AT) => {
        return () => ReduxUtils.createAction(actionType)
    };
    const createLoadReducer = <S>(attribute: keyof S) => {
        return (state: S, _) => {
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
    const registerLoadAction = <S, AT extends string>(rootReducerManager: RootReducerManager,
                                                      stateLabel: string,
                                                      stateAttribute: keyof S,
                                                      actionType: AT) => {
        const loadActionCreator = createLoadActionCreator(actionType);
        const reducer = createLoadReducer(stateAttribute);
        rootReducerManager.addReducer(stateLabel, actionType, reducer);
        return loadActionCreator
    };


    const createSuccessActionCreator = <AT extends string,T>(actionType: AT) => {
        return (value: T) => ReduxUtils.createAction(actionType, value)
    };
    const createSuccessReducer = <S extends Object>(attribute: keyof S) => {
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
    const registerSuccessAction = <S, V, AT extends string>(rootReducerManager: RootReducerManager,
                                                         stateLabel: string,
                                                         stateAttribute: keyof S,
                                                         actionType: AT) => {
        const successActionCreator = createSuccessActionCreator<AT,V>(actionType);
        const reducer = createSuccessReducer(stateAttribute);
        rootReducerManager.addReducer(stateLabel, actionType, reducer);
        return successActionCreator
    };


    const createErrorActionCreator = <AT extends string>(actionType: AT) => {
        return (error: any) => ReduxUtils.createAction(actionType, error)
    };
    const createErrorReducer = <S extends Object>(attribute: keyof S) => {
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
    };
    const registerErrorAction = <S, AT extends string>(rootReducerManager: RootReducerManager,
                                                      stateLabel: string,
                                                      stateAttribute: keyof S,
                                                      actionType: AT) => {
        const errorActionCreator = createErrorActionCreator(actionType);
        const reducer = createErrorReducer(stateAttribute);
        rootReducerManager.addReducer(stateLabel, actionType, reducer);
        return errorActionCreator
    };

    export const registerActionCreators = <S, V, LAT extends string, SAT extends string, EAT extends string>(rootReducerManager: RootReducerManager,
                                                                                                      stateLabel: string,
                                                                                                      stateAttribute: keyof S,
                                                                                                      loadActionType: LAT,
                                                                                                      successActionType: SAT,
                                                                                                      errorActionType: EAT) => {
        // rootReducerManager.setInitialState(stateLabel, INITIAL_ASYNC_VALUE);
        return {
            loadActionCreator: registerLoadAction(rootReducerManager, stateLabel, stateAttribute, loadActionType),
            successActionCreator: registerSuccessAction<S,V,SAT>(rootReducerManager, stateLabel, stateAttribute, successActionType),
            errorActionCreator: registerErrorAction(rootReducerManager, stateLabel, stateAttribute, errorActionType),
        }
    };

    export const registerThunkActionCreator = <S,V,U extends any[]>(rootReducerManager: RootReducerManager,
                                        stateLabel: string,
                                        stateAttribute: keyof S,
                                        actionPrefix: string,
                                        asyncFunction: (rootState: S, ...args: U) => Promise<V>): (...args: U) => ThunkAction<void,S,void,Action<any>> => {
        const {
            loadActionCreator,
            successActionCreator,
            errorActionCreator
        } = registerActionCreators(rootReducerManager, stateLabel, stateAttribute,
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
