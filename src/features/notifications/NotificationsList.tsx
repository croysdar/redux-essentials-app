import React, { useLayoutEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'

import { TimeAgo } from '@/components/TimeAgo'

import { PostAuthor } from '@/features/posts/PostAuthor'

import { allNotificationsRead, selectMetadataEntities, useGetNotificationsQuery } from './notificationsSlice'
import classNames from 'classnames'

export const NotificationsList = () => {
    const dispatch = useAppDispatch();
    const { data: notifications = [] } = useGetNotificationsQuery()
    const notificationsMetadata = useAppSelector(selectMetadataEntities)

    useLayoutEffect(() => {
        // set all notifications to read when this page is open
        dispatch(allNotificationsRead())
    })

    const renderedNotifications = notifications.map(notification => {
        // Get the metadata object matching this notification
        const metadata = notificationsMetadata[notification.id]

        const notificationClassName = classNames('notification', {
            new: metadata.isNew
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