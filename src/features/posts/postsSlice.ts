import { RootState } from '@/app/store'
import { nanoid, PayloadAction } from '@reduxjs/toolkit'
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
type NewPost = Pick<Post, 'title' | 'content' | 'user'>

const initialReactions: Reactions = {
    thumbsUp: 0,
    tada: 0,
    heart: 0,
    rocket: 0,
    eyes: 0,
}
export type ReactionName = keyof Reactions

// Create an initial state value for the reducer, with that type
const initialState: PostsState = {
    data: [],
    status: 'idle',
    error: null,
}

const sliceName = 'posts'
// Create the slice and pass in the initial state
const postsSlice = createAppSlice({
    name: sliceName,
    initialState,
    reducers: create => {
        return {
            postAdded: create.preparedReducer(
                (title: string, content: string, userId: string) => {
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
                },
                (state, action: PayloadAction<Post>) => {
                    // "Mutate" the existing state array, which is
                    // safe to do here because `createSlice` uses Immer inside.
                    state.data.push(action.payload)
                },
            ),

            postUpdated: create.reducer<PostUpdate>((state, action: PayloadAction<PostUpdate>) => {
                const { id, title, content } = action.payload
                const existingPost = state.data.find(post => post.id === id)
                if (existingPost) {
                    existingPost.title = title
                    existingPost.content = content
                }
            }),

            reactionAdded: create.reducer<{ postId: string; reaction: ReactionName }>(
                (state, action) => {
                    const { postId, reaction } = action.payload
                    const existingPost = state.data.find(post => post.id === postId)
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
                        state.data.push(...action.payload)
                    },
                    rejected: (state, action) => {
                        state.status = 'failed'
                        state.error = action.error.message ?? 'Unknown Error'
                    }
                }
            ),

            addNewPost : create.asyncThunk(
                async(initialPost: NewPost) => {
                    const response = await client.post<Post>('fakeApi/posts', initialPost)
                    return response.data
                },
                {
                    fulfilled: (state, action) => {
                        console.log(action.payload)
                        state.data.push(action.payload)
                    }
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
export const { postAdded, addNewPost, postUpdated, reactionAdded, fetchPosts } = postsSlice.actions

// Export the generated reducer function
export default postsSlice.reducer

export const selectAllPosts = (state: RootState) => state.posts.data

export const selectPostById = (state: RootState, postId: string | null) =>
    state.posts.data.find(post => post.id === postId)

export const selectPostsByUser = (state: RootState, userId: string) => {
    const allPosts = selectAllPosts(state)

    return allPosts.filter(post => post.user === userId)
}

export const selectPostsStatus = (state: RootState) => state.posts.status
export const selectPostsError = (state: RootState) => state.posts.error