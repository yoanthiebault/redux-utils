import {Replacer} from "./Replacer";
import {ThunkAction} from "redux-thunk";
import {Action, ReduxUtils} from "./ReduxUtils";
import {AsyncUtils} from "./AsyncUtils";

export interface RResource<T> {
    value: T
    syncing: boolean
    syncError: any
}

export interface RWResource<T> {
    // remoteValue: T
    localValue: T

    syncing: boolean
    syncError: any
}

type Unpack<T> = T extends RResource<infer U> ? U
    : T extends RWResource<infer U> ? U
        : never

export module SyncedResourceUtils {
    import RootReducerManager = ReduxUtils.RootReducerManager;


    export const INITIAL_RRESOURCE: RResource<any> = {
        value: null,
        syncing: false,
        syncError: null
    };

    function updateRResource<S, SA extends keyof S>(state: S, attribute: SA, content: S[SA] | Replacer<S[SA]>): S {
        return {
            ...(state as any),
            [attribute]: {
                ...(typeof content === "function" ? (content as any)(state[attribute] || INITIAL_RRESOURCE) : content)
            }
        }
    }

    export const registerRResource = <RS,
        SL extends keyof RS & string,
        SA extends keyof RS[SL],
        V extends Unpack<RS[SL][SA]>,
        U extends any[]>
    (
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        actionPrefix: string,
        onPull: (rootState: RS, ...args: U) => Promise<V>
    ): (...args: U) => ThunkAction<void, RS, void, Action<any>> => {

        const actions = {
            startPulling: `${actionPrefix}/startPulling`,
            pullError: `${actionPrefix}/pullError`,
            pullSuccess: `${actionPrefix}/pullSuccess`
        };

        const startPulling = () => ReduxUtils.createAction(actions.startPulling);
        const pullError = (err) => ReduxUtils.createAction(actions.pullError, {err});
        const pullSuccess = (resp) => ReduxUtils.createAction(actions.pullSuccess, {resp});

        rootReducerManager.addReducer<RS, SL, ReturnType<typeof startPulling>>(stateLabel, actions.startPulling, (state, action) =>
            updateRResource(state, stateAttribute, ((r: RResource<V>): RResource<V> => ({
                ...r,
                syncing: true
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pullError>>(stateLabel, actions.pullError, (state, action) =>
            updateRResource(state, stateAttribute, ((r: RResource<V>): RResource<V> => ({
                ...r,
                syncing: false,
                syncError: action.payload.err
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pullSuccess>>(stateLabel, actions.pullSuccess, (state, action) =>
            updateRResource(state, stateAttribute, ((r: RResource<V>): RResource<V> => ({
                syncing: false,
                syncError: null,
                value: action.payload.resp
            })) as any));

        return (...args) => (dispatch, getRootState) => {
            dispatch(startPulling());
            onPull(getRootState(), ...args)
                .then(value => dispatch(pullSuccess(value)))
                .catch(err => dispatch(pullError(err)))
        }
    };

    export const INITIAL_RWRESOURCE: RWResource<any> = {
        // remoteValue: null,
        localValue: null,
        syncing: false,
        syncError: null
    };

    function updateRWResource<S, SA extends keyof S, ID extends keyof S[SA]>(state: S, attribute: SA, id: ID, content: S[SA][ID] | Replacer<S[SA][ID]>): S {
        const subState: S[SA] = state[attribute] || {} as any;
        return {
            ...(state as any),
            [attribute]: {
                ...(subState as any),
                [id]: {
                    ...(typeof content === "function" ? (content as any)(subState[id] || INITIAL_RWRESOURCE) : content)
                }
            }
        }
    }

    export function registerRWResource<RS,
        SL extends keyof RS & string,
        SA extends keyof RS[SL],
        ID extends keyof RS[SL][SA],
        V extends Unpack<RS[SL][SA][ID]>,
        SYA extends any[]>
    (
        rootReducerManager: RootReducerManager,
        stateLabel: SL,
        stateAttribute: SA,
        actionPrefix: string,
        onPull: (rootState: RS, id: ID, ...args: SYA) => Promise<V>,
        onPush: (rootState: RS, id: ID, content: V, ...args: SYA) => Promise<V>
    ): {
        edit: (id: ID, content: V, ...args: SYA) => ThunkAction<void, RS, void, Action<any>>
        sync: (id: ID, ...args: SYA) => ThunkAction<Promise<V>, RS, void, Action<any>>,
    } {

        const actions = {
            startPulling: `${actionPrefix}/startPulling`,
            pullError: `${actionPrefix}/pullError`,
            pullSuccess: `${actionPrefix}/pullSuccess`,

            startPushing: `${actionPrefix}/startPushing`,
            pushError: `${actionPrefix}/pushError`,
            pushSuccess: `${actionPrefix}/pushSuccess`,

            edit: `${actionPrefix}/edit`,
        };

        const startPulling = (id) => ReduxUtils.createAction(actions.startPulling, {id});
        const pullError = (id, err) => ReduxUtils.createAction(actions.pullError, {id, err});
        const pullSuccess = (id, resp) => ReduxUtils.createAction(actions.pullSuccess, {id, resp});

        const startPushing = (id) => ReduxUtils.createAction(actions.startPushing, {id});
        const pushError = (id, err) => ReduxUtils.createAction(actions.pushError, {id, err});
        const pushSuccess = (id, resp) => ReduxUtils.createAction(actions.pushSuccess, {id, resp});

        const edit = (id, content) => ReduxUtils.createAction(actions.edit, {id, content});

        rootReducerManager.addReducer<RS, SL, ReturnType<typeof startPulling>>(stateLabel, actions.startPulling, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                syncing: true
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pullError>>(stateLabel, actions.pullError, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                syncing: false,
                syncError: action.payload.err
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pullSuccess>>(stateLabel, actions.pullSuccess, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                syncing: false,
                syncError: null,
                // remoteValue: action.payload.resp,
                localValue: action.payload.resp
            })) as any));

        rootReducerManager.addReducer<RS, SL, ReturnType<typeof startPushing>>(stateLabel, actions.startPushing, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                syncing: true
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pushError>>(stateLabel, actions.pushError, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                syncing: false,
                syncError: action.payload.err
            })) as any));
        rootReducerManager.addReducer<RS, SL, ReturnType<typeof pushSuccess>>(stateLabel, actions.pushSuccess, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                syncing: false,
                syncError: null
                // remoteValue: action.payload.resp,
                // localValue: action.payload.resp,
            })) as any));

        rootReducerManager.addReducer<RS, SL, ReturnType<typeof edit>>(stateLabel, actions.edit, (state, action) =>
            updateRWResource(state, stateAttribute, action.payload.id, ((r: RWResource<V>): RWResource<V> => ({
                ...r,
                localValue: action.payload.content
            })) as any));

        // const pushFunctions: any = {};
        const push = AsyncUtils.debounce((dispatch, getRootState, id, content, ...args): Promise<any> => {
            // const rootState = getRootState();
            // if (rootState[stateLabel]
            //     && rootState[stateLabel][stateAttribute]
            //     && rootState[stateLabel][stateAttribute][id]) {
            //     if ((rootState[stateLabel][stateAttribute][id] as any).pushing) {
            //         console.warn(`Already pushing when asking for pushing on ${stateLabel}/${stateAttribute}/${id}`)
            //     }
            //     if ((rootState[stateLabel][stateAttribute][id] as any).pulling) {
            //         console.warn(`Already pulling when asking for pushing on ${stateLabel}/${stateAttribute}/${id}`)
            //     }
            // }
            dispatch(startPushing(id));
            return onPush(getRootState(), id, content, ...(args as any))
                .then(resp => dispatch(pushSuccess(id, resp)))
                .catch(err => dispatch(pushError(id, err)));
        }, 500);

        return {
            sync: (id, ...args) => (dispatch, getRootState) => {
                const rootState = getRootState();
                // if (rootState[stateLabel]
                //     && rootState[stateLabel][stateAttribute]
                //     && rootState[stateLabel][stateAttribute][id]) {
                //     if ((rootState[stateLabel][stateAttribute][id] as any).pushing) {
                //         console.warn(`Already pushing when asking for pulling on ${stateLabel}/${stateAttribute}/${id}`)
                //     }
                //     if ((rootState[stateLabel][stateAttribute][id] as any).pulling) {
                //         console.warn(`Already pulling when asking for pulling on ${stateLabel}/${stateAttribute}/${id}`)
                //     }
                // }
                dispatch(startPulling(id));
                const promise = onPull(getRootState(), id, ...args);
                promise
                    .then(resp => dispatch(pullSuccess(id, resp)))
                    .catch(err => dispatch(pullError(id, err)));
                return promise
            },
            edit: (id, content, ...args) => (dispatch, getRootState) => {
                dispatch(edit(id, content));
                push(dispatch, getRootState, id, content, ...args);
            }
        }
    }
}