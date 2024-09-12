import { PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '@/app/store'
import { createAppSlice } from '@/app/hooks'

interface AuthState {
    username: string | null
}

const initialState: AuthState = {
    // Note: a real app would probably have more complex auth state,
    // but for this example we'll keep things simple
    username: null
}

const authSlice = createAppSlice({
    name: 'auth',
    initialState,
    reducers: create => {
        return {
            userLoggedIn: create.reducer<string>((state, action: PayloadAction<string>) => {
                state.username = action.payload
            }),
            userLoggedOut: create.reducer((state) => {
                state.username = null
            })
        }
    }
})

export const { userLoggedIn, userLoggedOut } = authSlice.actions

export const selectCurrentUsername = (state: RootState) => state.auth.username

export default authSlice.reducer