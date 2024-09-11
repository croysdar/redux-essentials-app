import { RootState } from '@/app/store'
import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'
import { sub } from 'date-fns'

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

type PostUpdate = Pick<Post, 'id' | 'title' | 'content'>

const initialReactions: Reactions = {
    thumbsUp: 0,
    tada: 0,
    heart: 0,
    rocket: 0,
    eyes: 0,
}
export type ReactionName = keyof Reactions

// Create an initial state value for the reducer, with that type
const initialState: Post[] = [
    {
        id: '1',
        title: 'First Post!',
        content: 'Hello!',
        user: '0',
        // Using sub to make the faux data be in the past
        date: sub(new Date(), { minutes: 10 }).toISOString(),
        reactions: initialReactions
    },
    {
        id: '2',
        title: 'Second Post',
        content: 'More text',
        user: '2',
        // Using sub to make the faux data be in the past
        date: sub(new Date(), { minutes: 5 }).toISOString(),
        reactions: initialReactions
    }
]

// Create the slice and pass in the initial state
const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        // Declare a "case reducer" named `postAdded`.
        // The type of `action.payload` will be a `Post` object.
        postAdded: {
            reducer(state, action: PayloadAction<Post>) {
                // "Mutate" the existing state array, which is
                // safe to do here because `createSlice` uses Immer inside.
                state.push(action.payload)
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
            const existingPost = state.find(post => post.id === id)
            if (existingPost) {
                existingPost.title = title
                existingPost.content = content
            }
        },

        reactionAdded(state, action: PayloadAction<{postId: string; reaction: ReactionName}>) {
            const { postId, reaction } = action.payload
            const existingPost = state.find(post => post.id === postId)
            if (existingPost) {
                // increment chosen reaction on chosen post
                existingPost.reactions[reaction]++
            }
        }
    },
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

export const selectAllPosts = (state: RootState) => state.posts

export const selectPostById = (state: RootState, postId: string | null) =>
    state.posts.find(post => post.id === postId)