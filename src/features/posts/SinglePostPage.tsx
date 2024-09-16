import React from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAppSelector } from '@/app/hooks'
import { PostAuthor } from './PostAuthor'
import { TimeAgo } from '@/components/TimeAgo'
import { ReactionButtons } from './ReactionButton'
import { selectCurrentUserID } from '../auth/authSlice'
import { useGetPostQuery } from '../api/apiSlice'
import { Spinner } from '@/components/Spinner'

export const SinglePostPage = () => {
    const { postId } = useParams()

    const currentUserID = useAppSelector(selectCurrentUserID)!

    const {
        data: post,
        isFetching,
        isSuccess
    } = useGetPostQuery(postId!)

    let content: React.ReactNode


    if (!post) {
        content =
            <section>
                <h2>Post not found!</h2>
            </section>
    }
    if (isFetching) {
        content = <Spinner text="Loading..." />
    }
    else if (isSuccess) {
        const canEdit = currentUserID === post.user
        content =
            <article className="post">
                <h2>{post.title}</h2>
                <PostAuthor userId={post.user} />
                <TimeAgo timestamp={post.date} />
                <p className="post-content">{post.content}</p>
                {canEdit &&
                    <Link to={`/editPost/${post.id}`} className="button"> Edit Post </Link>
                }
                <ReactionButtons post={post} />
            </article>
    }

    return <section>{content}</section>
}