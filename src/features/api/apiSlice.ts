// Import the RTK Query methods from the React-specific entry point
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Use the `Post` type we've already defined in `postsSlice`,
// and then re-export it for ease of use
import type { NewPost, Post, PostUpdate, ReactionName } from '@/features/posts/postsSlice'
export type { Post }

// Define our single API slice object
export const apiSlice = createApi({
    // The cache reducer expects to be added at `state.api` (already default - this is optional)
    reducerPath: 'api',
    // All of our requests will have URLs starting with '/fakeApi'
    baseQuery: fetchBaseQuery({ baseUrl: '/fakeApi' }),
    // A "tag" is a string or small object that lets you give identifiers to certain types of data, and "invalidate" portions of the cache.
    tagTypes: ['Post'],
    // The "endpoints" represent operations and requests for this server
    endpoints: builder => ({
        // The `getPosts` endpoint is a "query" operation that returns data.
        // The return value is a `Post[]` array, and it takes no arguments.
        getPosts: builder.query<Post[], void>({
            // The URL for the request is '/fakeApi/posts'
            query: () => '/posts',
            // providesTags: (result = [], error, arg) => [
            providesTags: (result = []) => [
                'Post',
                ...result.map(({ id }) => ({ type: 'Post', id }) as const)
            ]
        }),
        getPost: builder.query<Post, string>({
            // The URL for the request is '/fakeApi/posts'
            query: postId => `/posts/${postId}`,
            providesTags: (result, error, arg) => [{ type: 'Post', id: arg }]
        }),
        addNewPost: builder.mutation<Post, NewPost>({
            query: initialPost => ({
                // The HTTP URL will be '/fakeApi/posts'
                url: '/posts',
                // This is an HTTP POST request, sending an update
                method: 'POST',
                // Include the entire post object as the body of the request
                body: initialPost
            }),
            // a set of tags that are invalidated every time that mutation runs
            invalidatesTags: ['Post']
        }),
        editPost: builder.mutation<Post, PostUpdate>({
            query: post => ({
                url: `posts/${post.id}`,
                method: 'PATCH',
                body: post
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'Post', id: arg.id }]
        }),
        addReaction: builder.mutation<Post, { postId: string; reaction: ReactionName }>({
            query: ({ postId, reaction }) => ({
                url: `posts/${postId}/reactions`,
                method: 'POST',
                body: { reaction }
            }),
            async onQueryStarted({ postId, reaction }, lifecycleApi) {
                // `updateQueryData` requires the endpoint name and cache key arguments,
                // so it knows which piece of cache state to update
                const getPostsPatchResult = lifecycleApi.dispatch(
                    apiSlice.util.updateQueryData('getPosts', undefined, draft => {
                        // The `draft` is Immer-wrapped and can be "mutated" like in createSlice
                        const post = draft.find(post => post.id === postId)
                        if (post) {
                            post.reactions[reaction]++
                        }
                    })
                )

                // We also have another copy of the same data in the `getPost` cache
                // entry for this post ID, so we need to update that as well
                const getPostPatchResult = lifecycleApi.dispatch(
                    apiSlice.util.updateQueryData('getPost', postId, draft => {
                        draft.reactions[reaction]++
                    })
                )

                try {
                    await lifecycleApi.queryFulfilled
                } catch {
                    getPostsPatchResult.undo()
                    getPostPatchResult.undo()
                }
            }
        })
    })
})

export const {
    useGetPostsQuery,
    useGetPostQuery,
    useAddNewPostMutation,
    useEditPostMutation,
    useAddReactionMutation
} = apiSlice