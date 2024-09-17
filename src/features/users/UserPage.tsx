import React from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAppSelector } from '@/app/hooks'

import { selectUserById } from './usersSlice'
import { Post, useGetPostsQuery } from '../api/apiSlice'
import { BaseQueryFn, TypedUseQueryStateResult } from '@reduxjs/toolkit/query/react'
import { createSelector } from '@reduxjs/toolkit'

// Create a TS type that represents "the result value passed
// into the `selectFromResult` function for this hook"
type GetPostSelectFromResultsArg = TypedUseQueryStateResult<Post[], unknown, BaseQueryFn>

const selectPostsForUser = createSelector(
  (res: GetPostSelectFromResultsArg) => res.data,
  (res: GetPostSelectFromResultsArg, userId: string) => userId,
  (data, userId) => data?.filter(post => post.user === userId)
)

export const UserPage = () => {
  const { userId } = useParams()

  const user = useAppSelector(state => selectUserById(state, userId!))

  // selectFromResult is good for situations like this where you want a filtered list
  const { postsForUser } = useGetPostsQuery(undefined, {
    selectFromResult: result => ({
      ...result,
      postsForUser: selectPostsForUser(result, userId!)
    }),
  })

  if (!user) {
    return (
      <section>
        <h2>User not found!</h2>
      </section>
    )
  }

  const postTitles = postsForUser?.map(post => (
    <li key={post.id}>
      <Link to={`/posts/${post.id}`}>{post.title}</Link>
    </li>
  ))

  return (
    <section>
      <h2>{user.name}</h2>

      <ul>{postTitles}</ul>
    </section>
  )
}