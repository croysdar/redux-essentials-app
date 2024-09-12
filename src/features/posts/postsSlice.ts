import { RootState } from '@/app/store'
import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'
import { userLoggedOut } from '../auth/authSlice'
import { createAppAsyncThunk } from '@/app/withTypes'
import { client } from '@/api/client'

export interface Reactions {
    thumbsUp: number
    tada: number
    heart: number
    rocket: number
    eyes: number
}

// Define a TS type for the data we'll be using
export interface Post {
    id: string
    title: string
    content: string
    user: string
    date: string
    reactions: Reactions
}

interface PostsState {
    data: Post[]
    status: Status
    error: string | null
}

type Status = 'idle' | 'pending' | 'succeeded' | 'failed'

type PostUpdate = Pick<Post, 'id' | 'title' | 'content'>

const initialReactions: Reactions = {
    thumbsUp: 0,
    tada: 0,
    heart: 0,
    rocket: 0,
    eyes: 0,
}
export type ReactionName = keyof Reactions

const sliceName = 'posts'

export const fetchPosts = createAppAsyncThunk(
    `${sliceName}/fetchPosts`,
    async () => {
        const response = await client.get<Post[]>('fakeApi/posts')
        return response.data
    },
    {
        condition(arg, thunkApi) {
            const postsStatus = selectPostsStatus(thunkApi.getState())
            if (postsStatus !== 'idle') {
                return false
            }
        }

    })

// Create an initial state value for the reducer, with that type
const initialState: PostsState = {
    data: [],
    status: 'idle',
    error: null,
}

// Create the slice and pass in the initial state
const postsSlice = createSlice({
    name: sliceName,
    initialState,
    reducers: {
        // Declare a "case reducer" named `postAdded`.
        // The type of `action.payload` will be a `Post` object.
        postAdded: {
            reducer(state, action: PayloadAction<Post>) {
                // "Mutate" the existing state array, which is
                // safe to do here because `createSlice` uses Immer inside.
                state.data.push(action.payload)
            },
            prepare(title: string, content: string, userId: string) {
                return {
                    payload: {
                        id: nanoid(),
                        title,
                        content,
                        user: userId,
                        date: new Date().toISOString(),
                        reactions: initialReactions
                    }
                }
            }
        },

        postUpdated(state, action: PayloadAction<PostUpdate>) {
            const { id, title, content } = action.payload
            const existingPost = state.data.find(post => post.id === id)
            if (existingPost) {
                existingPost.title = title
                existingPost.content = content
            }
        },

        reactionAdded(state, action: PayloadAction<{ postId: string; reaction: ReactionName }>) {
            const { postId, reaction } = action.payload
            const existingPost = state.data.find(post => post.id === postId)
            if (existingPost) {
                // increment chosen reaction on chosen post
                existingPost.reactions[reaction]++
            }
        }
    },

    extraReducers: (builder) => {
        // Pass the action creator to `builder.addCase()`
        builder.addCase(userLoggedOut, () => {
            // Clear out the list of posts whenever the user logs out
            return initialState
        })
            .addCase(fetchPosts.pending, (state) => {
                state.status = 'pending'
            })
            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data.push(...action.payload)
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message ?? 'Unknown Error'
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
export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions

// Export the generated reducer function
export default postsSlice.reducer

export const selectAllPosts = (state: RootState) => state.posts.data

export const selectPostById = (state: RootState, postId: string | null) =>
    state.posts.data.find(post => post.id === postId)

export const selectPostsStatus = (state: RootState) => state.posts.status
export const selectPostsError = (state: RootState) => state.posts.error