import { Link, useParams } from 'react-router-dom'

import { useAppSelector } from '@/app/hooks'
import { selectPostById } from './postsSlice'
import { PostAuthor } from './PostAuthor'
import { TimeAgo } from '@/components/TimeAgo'
import { ReactionButtons } from './ReactionButton'
import { selectCurrentUserID } from '../users/usersSlice'

export const SinglePostPage = () => {
    const { postId } = useParams()

    const post = useAppSelector(state => selectPostById(state, postId!))
    const currentUserID = useAppSelector(selectCurrentUserID)!

    if (!post) {
        return (
            <section>
                <h2>Post not found!</h2>
            </section>
        )
    }

    const canEdit = currentUserID === post.user

    return (
        <section>
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
        </section>
    )
}