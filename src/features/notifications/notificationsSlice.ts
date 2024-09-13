import { client } from '@/api/client'

import type { RootState } from '@/app/store'
import { createAppSlice } from '@/app/hooks'
import { createEntityAdapter } from '@reduxjs/toolkit'

export interface ServerNotification {
    id: string
    date: string
    message: string
    user: string
}

export interface ClientNotification extends ServerNotification {
    read: boolean
    isNew: boolean
}

const notificationsAdapter = createEntityAdapter<ClientNotification>({
    sortComparer: (a,b) => b.date.localeCompare(a.date)
})

const initialState = notificationsAdapter.getInitialState()

const notificationsSlice = createAppSlice({
    name: 'notifications',
    initialState,
    reducers: create => {
        return {
            allNotificationsRead: create.reducer(
                (state) => {
                    Object.values(state.entities).forEach(notification => {
                        notification.read = true
                    })
                }
            ),
            fetchNotifications: create.asyncThunk(
                async (_unused, thunkApi) => {
                    const allNotifications = selectAllNotifications(thunkApi.getState() as RootState) as ClientNotification[]
                    const [latestNotification] = allNotifications
                    const latestTimestamp = latestNotification ? latestNotification.date : ''

                    const response = await client.get<ServerNotification[]>(
                        `/fakeApi/notifications?since=${latestTimestamp}`
                    )
                    return response.data
                },
                {
                    options: {
                        // condition(_unused, thunkApi) {
                        //     const { notifications } = thunkApi.getState() as RootState
                        //     if (notifications.status !== 'idle')  {
                        //         return false;
                        //     }
                        // }
                    },
                    // pending: (state) => {
                    // state.status = 'pending';
                    // },
                    fulfilled: (state, action) => {
                        // state.status = 'succeeded';
                        const notificationsWithMetadata: ClientNotification[] =
                            action.payload.map(notification => ({
                                ...notification,
                                read: false,
                                isNew: true
                            }))

                        Object.values(state.entities).forEach(notification => {
                            notification.isNew = !notification.read
                        })

                        // state.push(...notificationsWithMetadata)
                        // state.sort((a, b) => b.date.localeCompare(a.date)); // Sort by date
                        notificationsAdapter.upsertMany(state, notificationsWithMetadata)
                    },
                    // rejected: (state, action) => {
                    // state.status = 'failed';
                    // state.error = action.error.message ?? 'Unknown Error';
                    // }
                }
            )

        }
    }
})

export const { allNotificationsRead, fetchNotifications } = notificationsSlice.actions

export default notificationsSlice.reducer

export const {selectAll: selectAllNotifications } = 
    notificationsAdapter.getSelectors((state: RootState) => state.notifications)

export const selectUnreadNotificationsCount = (state: RootState) => {
    const allNotifications = selectAllNotifications(state)
    const unreadNotifications = allNotifications.filter(
        notification => !notification.read
    )
    return unreadNotifications.length
}