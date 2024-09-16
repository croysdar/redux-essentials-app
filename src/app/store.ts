import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'

import postsReducer from '@/features/posts/postsSlice'
import authReducer from '@/features/auth/authSlice'
import notificationsReducer from '@/features/notifications/notificationsSlice'
import { listenerMiddleware } from './listenerMiddleware'
import { apiSlice } from '@/features/api/apiSlice'


export const store = configureStore({
    // Pass in the root reducer setup as the `reducer` argument
    reducer: {
        auth: authReducer,
        posts: postsReducer,
        notifications: notificationsReducer,
        [apiSlice.reducerPath]: apiSlice.reducer
    },
    // preserve existing middleware, but add the listener to the beginning of the middleware array
    middleware: getDefaultMiddleware => 
        getDefaultMiddleware()
            .prepend(listenerMiddleware.middleware)
            .concat(apiSlice.middleware)
})

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Same for the `RootState` type
export type RootState = ReturnType<typeof store.getState>
// Export a reusable type for handwritten thunks
export type AppThunk = ThunkAction<void, RootState, unknown, Action>