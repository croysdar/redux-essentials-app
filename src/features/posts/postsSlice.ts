import { RootState } from '@/app/store'
import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'

// Define a TS type for the data we'll be using
export interface Post {
    id: string
    title: string
    content: string
}

// Create an initial state value for the reducer, with that type
const initialState: Post[] = [
    { id: '1', title: 'First Post!', content: 'Hello!' },
    { id: '2', title: 'Second Post', content: 'More text' }
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
            prepare(title: string, content: string) {
                return {
                    payload: { id: nanoid(), title, content }
                }
            }
        },

        postUpdated(state, action: PayloadAction<Post>) {
            const { id, title, content } = action.payload
            const existingPost = state.find(post => post.id === id)
            if (existingPost) {
                existingPost.title = title
                existingPost.content = content
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
export const { postAdded, postUpdated } = postsSlice.actions

// Export the generated reducer function
export default postsSlice.reducer

export const selectAllPosts = (state: RootState) => state.posts

export const selectPostById = (state: RootState, postId: string) =>
    state.posts.find(post => post.id === postId)