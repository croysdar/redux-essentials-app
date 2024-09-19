import type { AppThunk, RootState } from '@/app/store'
import { createAppSlice } from '@/app/hooks'
import { createAction, createEntityAdapter, createSelector, isAnyOf } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice'
import { forceGenerateNotifications } from '@/api/server'

export interface ServerNotification {
    id: string
    date: string
    message: string
    user: string
}

export interface NotificationMetadata {
    id: string
    read: boolean
    isNew: boolean
}

const metadataAdapter = createEntityAdapter<NotificationMetadata>()

const initialState = metadataAdapter.getInitialState()

const notificationsReceived = createAction<ServerNotification[]>('notifications/notificationsReceived')

const apiSliceWithNotifications = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getNotifications: builder.query<ServerNotification[], void>({
            query: () => '/notifications',
            async onCacheEntryAdded(arg, lifecycleApi) {
                // create a websocket connection when the cache subscription starts
                const ws = new WebSocket('ws://localhost')
                try {
                    // wait for the initial query to resolve before proceeding
                    await lifecycleApi.cacheDataLoaded

                    // when data is received from the socket connection to the server,
                    // update our query result with the received message
                    const listener = (event: MessageEvent<string>) => {
                        const message: {
                            type: 'notifications',
                            payload: ServerNotification[]
                        } = JSON.parse(event.data)

                        switch (message.type) {
                            case 'notifications': {

                                lifecycleApi.updateCachedData(draft => {
                                    // Insert all received notifications from the websocket
                                    // into the existing RTKQ cache array
                                    draft.push(...message.payload)
                                    draft.sort((a, b) => b.date.localeCompare(a.date))
                                })
                                // Dispatch an additional action so we can track "read" state
                                lifecycleApi.dispatch(notificationsReceived(message.payload))
                                break
                            }
                            default:
                                break
                        }
                    }

                    ws.addEventListener('message', listener)
                } catch {
                    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
                    // in which case `cacheDataLoaded` will throw
                }
                // cacheEntryRemoved will resolve when the cache subscription is no longer active
                await lifecycleApi.cacheEntryRemoved
                // perform cleanup steps once the `cacheEntryRemoved` promise resolves
                ws.close()

            }
        })
    })
})

export const { useGetNotificationsQuery } = apiSliceWithNotifications

const matchNotificationsReceived = isAnyOf(
    notificationsReceived,
    apiSliceWithNotifications.endpoints.getNotifications.matchFulfilled
)

export const fetchNotificationsWebsocket =
    (): AppThunk => (dispatch, getState) => {
        const allNotifications = selectNotificationsData(getState())
        const [latestNotification] = allNotifications
        const latestTimestamp = latestNotification?.date ?? ''

        forceGenerateNotifications(latestTimestamp)
    }

const emptyNotifications: ServerNotification[] = []

export const selectNotificationsResult =
    apiSliceWithNotifications.endpoints.getNotifications.select()

const selectNotificationsData = createSelector(
    selectNotificationsResult,
    notificationsResult => notificationsResult.data ?? emptyNotifications
)

const notificationsSlice = createAppSlice({
    name: 'notifications',
    initialState,
    reducers: create => {
        return {
            allNotificationsRead: create.reducer(
                (state) => {
                    Object.values(state.entities).forEach(metadata => {
                        metadata.read = true
                    })
                }
            ),
        }
    },
    extraReducers(builder) {
        builder.addMatcher(
            matchNotificationsReceived,
            (state, action) => {
                // Add client-side metadata for tracking new notifications
                const notificationsMetadata: NotificationMetadata[] =
                    action.payload.map(notification => ({
                        // Give the metadata object the same ID as the notification
                        id: notification.id,
                        read: false,
                        isNew: true
                    }))

                Object.values(state.entities).forEach(metadata => {
                    // Any notifications we've read are no longer new
                    metadata.isNew = !metadata.read
                })

                metadataAdapter.upsertMany(state, notificationsMetadata)
            }
        )
    }
})

export const { allNotificationsRead } = notificationsSlice.actions

export default notificationsSlice.reducer

export const {
    selectAll: selectAllNotificationsMetadata,
    selectEntities: selectMetadataEntities
} = metadataAdapter.getSelectors((state: RootState) => state.notifications)

export const selectUnreadNotificationsCount = (state: RootState) => {
    const allMetadata = selectAllNotificationsMetadata(state)
    const unreadNotifications = allMetadata.filter(
        metadata => !metadata.read
    )
    return unreadNotifications.length
}