import React, { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { addNewPost } from './postsSlice'
import { selectCurrentUserID } from '../users/usersSlice'
import { Spinner } from '@/components/Spinner'

// TS types for the input fields
// See: https://epicreact.dev/how-to-type-a-react-form-on-submit-handler/
interface AddPostFormFields extends HTMLFormControlsCollection {
    postTitle: HTMLInputElement
    postContent: HTMLTextAreaElement
}
interface AddPostFormElements extends HTMLFormElement {
    readonly elements: AddPostFormFields
}

export const AddPostForm = () => {
    const [addRequestStatus, setAddRequestStatus] = useState<'idle' |'pending'>('idle')
    // Get the `dispatch` method from the store
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectCurrentUserID)!;


    const handleSubmit = async (e: React.FormEvent<AddPostFormElements>) => {
        // Prevent server submission
        e.preventDefault()

        const { elements } = e.currentTarget
        const title = elements.postTitle.value
        const content = elements.postContent.value

        const form = e.currentTarget

        try {
            setAddRequestStatus('pending')
            await dispatch(addNewPost({title, content, user: userId})).unwrap()

            form.reset()
        } catch (err) {
            console.log('Failed to save the post: ', err)
        } finally {
            setAddRequestStatus('idle')
        }
    }

    return (
        <section>
            <h2>Add a New Post</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="postTitle">Post Title:</label>
                <input type="text" id="postTitle" defaultValue="" required />

                <label htmlFor="postContent">Content:</label>
                <textarea
                    id="postContent"
                    name="postContent"
                    defaultValue=""
                    required
                />
                {
                    addRequestStatus === 'idle' ?
                        <button>Save Post</button>
                        :
                        <Spinner/>
                }
            </form>
        </section>
    )
}