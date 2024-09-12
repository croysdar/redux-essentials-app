import { RootState } from '@/app/store'
import { createAppSlice } from '@/app/hooks'
import { client } from '@/api/client'

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
            login : create.asyncThunk(
                async(username : string) => {
                    await client.post<string>('fakeApi/login', username)
                    return username
                },
                {
                    fulfilled: (state, action) => {
                        state.username = action.payload
                    }
                }
            ),
            logout : create.asyncThunk(
                async() => {
                    await client.post<string>('fakeApi/logout', {})
                },
                {
                    fulfilled: (state) => {
                        state.username = null
                    }
                }
            ),
        }
    }
})

export const { login, logout } = authSlice.actions

export const selectCurrentUsername = (state: RootState) => state.auth.username

export default authSlice.reducer