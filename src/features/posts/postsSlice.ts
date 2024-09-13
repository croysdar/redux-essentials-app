import { RootState } from '@/app/store'
import { createEntityAdapter, createSelector, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { logout } from '../auth/authSlice'
import { client } from '@/api/client'
import { createAppSlice } from '@/app/hooks'

export interface Reactions {
    thumbsUp: number
    tada: number
    heart: number
    rocket: number
    eyes: number
}
export type ReactionName = keyof Reactions

// Define a TS type for the data we'll be using
export interface Post {
    id: string
    title: string
    content: string
    user: string
    date: string
    reactions: Reactions
}

interface PostsState extends EntityState<Post, string> {
    status: Status
    error: string | null
}

const postsAdapter = createEntityAdapter<Post>({
    sortComparer: (a,b) => b.date.localeCompare(a.date)
})

type Status = 'idle' | 'pending' | 'succeeded' | 'failed'

type PostUpdate = Pick<Post, 'id' | 'title' | 'content'>
type NewPost = Pick<Post, 'title' | 'content' | 'user'>

// Create an initial state value for the reducer, with that type
const initialState: PostsState = postsAdapter.getInitialState({
    status: 'idle',
    error: null
})

const sliceName = 'posts'
// Create the slice and pass in the initial state
const postsSlice = createAppSlice({
    name: sliceName,
    initialState,
    reducers: create => {
        return {
            postUpdated: create.reducer<PostUpdate>((state, action: PayloadAction<PostUpdate>) => {
                const { id, title, content } = action.payload
                postsAdapter.updateOne(state, { id, changes: { title, content } })
            }),

            reactionAdded: create.reducer<{ postId: string; reaction: ReactionName }>(
                (state, action) => {
                    const { postId, reaction } = action.payload
                    const existingPost = state.entities[postId]
                    if (existingPost) {
                        // increment chosen reaction on chosen post
                        existingPost.reactions[reaction]++
                    }
                }
            ),

            fetchPosts: create.asyncThunk(
                async () => {
                    const response = await client.get<Post[]>('fakeApi/posts')
                    return response.data
                },
                {
                    options: {
                        condition(_unused, thunkApi) {
                            const { posts } = thunkApi.getState() as RootState
                            if (posts.status !== 'idle') {
                                return false
                            }
                        }
                    },
                    // The case reducers to handle the dispatched actions.
                    // Each of these is optional, but must use these names.
                    pending: (state) => {
                        state.status = 'pending'
                    },
                    fulfilled: (state, action) => {
                        state.status = 'succeeded'
                        // Add any fetched posts to the array
                        postsAdapter.setAll(state, action.payload)
                    },
                    rejected: (state, action) => {
                        state.status = 'failed'
                        state.error = action.error.message ?? 'Unknown Error'
                    }
                }
            ),

            addNewPost: create.asyncThunk(
                async (initialPost: NewPost) => {
                    const response = await client.post<Post>('fakeApi/posts', initialPost)
                    return response.data
                },
                {
                    // fulfilled: (state, action) => {
                    //     state.data.push(action.payload)
                    // }
                    fulfilled: postsAdapter.addOne
                }
            )
        }
    },

    extraReducers: (builder) => {
        // Pass the action creator to `builder.addCase()`
        builder.addCase(logout.fulfilled, () => {
            // Clear out the list of posts whenever the user logs out
            return initialState
        })
    }

    // selectors: {
    //     selectAllPosts: postsState => postsState,
    //     selectPostById: (postsState, postId: string) => {
    //         return postsState.find(post => post.id === postId)
    //     }
    // }
})

// Export the auto-generated action creator with the same name
export const { addNewPost, postUpdated, reactionAdded, fetchPosts } = postsSlice.actions

// Export the generated reducer function
export default postsSlice.reducer

export const {
    selectAll: selectAllPosts,
    selectById: selectPostById,
    selectIds: selectPostIds
} = postsAdapter.getSelectors((state: RootState) => state.posts)

// using createSelector makes this memoized
export const selectPostsByUser = createSelector(
    // Pass in one or more "input selectors"
    [
        // we can pass in an existing selector function that
        // reads something from the root `state` and returns it
        selectAllPosts,
        // and another function that extracts one of the arguments
        // and passes that onward
        (state: RootState, userId: string) => userId
    ],
    // the output function gets those values as its arguments,
    // and will run when either input value changes
    (posts, userId) => posts.filter(post => post.user === userId)
)


export const selectPostsStatus = (state: RootState) => state.posts.status
export const selectPostsError = (state: RootState) => state.posts.error