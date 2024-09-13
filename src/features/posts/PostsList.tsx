import React from 'react'
import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { 
    fetchPosts, 
    selectPostById, 
    selectPostIds, 
    selectPostsError, 
    selectPostsStatus 
} from './postsSlice'

import { TimeAgo } from '@/components/TimeAgo'
import { PostAuthor } from './PostAuthor'
import { ReactionButtons } from './ReactionButton'
import { useEffect } from 'react'
import { Spinner } from '@/components/Spinner'
import { useSelector } from 'react-redux'

interface PostExcerptProps {
    postId: string
}

function PostExcerpt({ postId }: PostExcerptProps) {
    const post = useAppSelector(state => selectPostById(state, postId))
    return (
        <article className="post-excerpt" key={post.id}>
            <h3>
                <Link to={`/posts/${post.id}`}> {post.title} </Link>
            </h3>
            <PostAuthor userId={post.user} />
            <TimeAgo timestamp={post.date} />
            <p className="post-content">{post.content.substring(0, 100)}</p>
            <ReactionButtons post={post} />
        </article>
    )
}

export const PostsList = () => {
    const dispatch = useAppDispatch()
    const orderedPostIds = useSelector(selectPostIds)

    const postsStatus = useAppSelector(selectPostsStatus)
    const postsError = useAppSelector(selectPostsError)

    useEffect(() => {
        if (postsStatus === 'idle') {
            dispatch(fetchPosts())
        }
    }, [postsStatus, dispatch])

    let content: React.ReactNode

    if (postsStatus === 'pending') {
        content = <Spinner text='Loading...' />
    } else if (postsStatus === 'succeeded') {
        content = orderedPostIds.map(postId => (
            <PostExcerpt key={postId} postId={postId} />
        ))
    } else 
        content = <div>{postsError}</div>

    return (
        <section className="posts-list">
            <h2>Posts</h2>
            {content}
        </section>
    )
}