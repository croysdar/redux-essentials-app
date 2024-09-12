import { RootState } from '@/app/store'
import { selectCurrentUsername } from '../auth/authSlice'
import { createAppSlice } from '@/app/hooks'
import { client } from '@/api/client'

// Define a TS type for the data we'll be using
export interface User {
    id: string
    name: string
}

// Create an initial state value for the reducer, with that type
const initialState: User[] = []

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
                    fulfilled: (state, action) => {
                        return action.payload
                    }

                }
            )
        }
    },
})

// Export the auto-generated action creator with the same name
export const { fetchUsers } = usersSlice.actions

// Export the generated reducer function
export default usersSlice.reducer

export const selectAllUsers = (state: RootState) => state.users

export const selectUserById = (state: RootState, userId: string | null) =>
    state.users.find(user => user.id === userId)

export const selectUserByName = (state: RootState, userName: string | null) =>
    state.users.find(user => user.name === userName)

export const selectCurrentUser = (state: RootState) => {
    const currentUsername = selectCurrentUsername(state)
    return selectUserByName(state, currentUsername)
}

export const selectCurrentUserID = (state: RootState) => {
    const currentUser = selectCurrentUser(state);
    return currentUser?.id
}