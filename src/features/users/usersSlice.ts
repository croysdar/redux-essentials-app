import { RootState } from '@/app/store'
import { createAppSlice } from '@/app/hooks'
import { client } from '@/api/client'
import { createEntityAdapter } from '@reduxjs/toolkit'
import { selectCurrentUserID } from '../auth/authSlice'

// Define a TS type for the data we'll be using
export interface User {
    id: string
    name: string
}

const usersAdapter = createEntityAdapter<User>()

const initialState = usersAdapter.getInitialState()

// Create the slice and pass in the initial state
const usersSlice = createAppSlice({
    name: 'users',
    initialState,
    reducers: create => {
        return {
            fetchUsers: create.asyncThunk(
                async () => {
                    const response = await client.get<User[]>('fakeApi/users')
                    return response.data
                },
                {
                    fulfilled: usersAdapter.setAll
                }
            )
        }
    },
})

// Export the auto-generated action creator with the same name
export const { fetchUsers } = usersSlice.actions

// Export the generated reducer function
export default usersSlice.reducer

export const {
    selectAll: selectAllUsers,
    selectById: selectUserById
} = usersAdapter.getSelectors((state: RootState) => state.users)

export const selectCurrentUser = (state: RootState) => {
    const currentUserId = selectCurrentUserID(state) as string
    if (!currentUserId) {return}
    return selectUserById(state, currentUserId)
}