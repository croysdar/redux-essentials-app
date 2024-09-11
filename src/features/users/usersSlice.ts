import { RootState } from '@/app/store'
import { createSlice } from '@reduxjs/toolkit'
import { selectCurrentUsername } from '../auth/authSlice'

// Define a TS type for the data we'll be using
export interface User {
    id: string
    name: string
}

// Create an initial state value for the reducer, with that type
const initialState: User[] = [
    { id: '0', name: 'Tianna Jenkins' },
    { id: '1', name: 'Kevin Grant' },
    { id: '2', name: 'Madison Price' }
]

// Create the slice and pass in the initial state
const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: { },
})

// Export the auto-generated action creator with the same name
export const { } = usersSlice.actions

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