import { RootState } from '@/app/store'
import { createEntityAdapter, createSelector, EntityState } from '@reduxjs/toolkit'
import { selectCurrentUserID } from '../auth/authSlice'
import { apiSlice } from '../api/apiSlice'

// Define a TS type for the data we'll be using
export interface User {
    id: string
    name: string
}

const usersAdapter = createEntityAdapter<User>()
const initialState = usersAdapter.getInitialState()

export const apiSliceWithUsers = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getUsers: builder.query<EntityState<User, string>, void>({
            query: () => '/users',
            transformResponse(res: User[]) {
                // Create a normalized state object containing all the user items
                return usersAdapter.setAll(initialState, res)
            }
        })
    })
})

export const { useGetUsersQuery } = apiSliceWithUsers

// Calling `someEndpoint.select(someArg)` generates a new selector that will return
// the query result object for a query with those parameters.
// To generate a selector for a specific query argument, call `select(theQueryArg)`.
// In this case, the users query has no params, so we don't pass anything to select()
export const selectUsersResult = apiSliceWithUsers.endpoints.getUsers.select()

const selectUsersData = createSelector(
    selectUsersResult,
    result => result.data ?? initialState
)

export const selectCurrentUser = (state: RootState) => {
    const currentUserID = selectCurrentUserID(state)
    if (currentUserID) {
        return selectUserById(state, currentUserID)
    }
}

export const { selectAll: selectAllUsers, selectById: selectUserById } = usersAdapter.getSelectors(selectUsersData)