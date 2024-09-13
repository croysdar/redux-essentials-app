import React, { useLayoutEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { TimeAgo } from '@/components/TimeAgo'

import { PostAuthor } from '@/features/posts/PostAuthor'

import { allNotificationsRead, selectAllNotifications } from './notificationsSlice'
import classNames from 'classnames'

export const NotificationsList = () => {
    const notifications = useAppSelector(selectAllNotifications)
    const dispatch = useAppDispatch();

    useLayoutEffect(() => {
        dispatch(allNotificationsRead())
    })

    const renderedNotifications = notifications.map(notification => {
        const notificationClassName = classNames('notification', {
            new: notification.isNew
        })

        return (
            <div key={notification.id} className={notificationClassName}>
                <div>
                    <b>
                        <PostAuthor userId={notification.user} showPrefix={false} />
                    </b>{' '}
                    {notification.message}
                </div>
                <TimeAgo timestamp={notification.date} />
            </div>
        )
    })

    return (
        <section className="notificationsList">
            <h2>Notifications</h2>
            {renderedNotifications}
        </section>
    )
}