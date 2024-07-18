import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext, notificationContext } from "../contexts";
import { timeDifference } from "../helpers";
import { getUser } from "../network";
import "../styles/NotificationList.css";

export default function NotificationList({ data, setData, onClick }) {
    const user = useContext(UserContext);
    const setUnreadNotificationCount = useContext(notificationContext);

    const componentMap = {
        FRIEND_REQUEST: FriendRequestNotification,
        FRIEND_REQUEST_ACCEPTED: FriendRequestNotification,
        FRIEND_POSTED: FriendPostedNotification,
        POST_LIKED: PostLikedNotification,
        POST_COMMENTED: PostCommentedNotification,
    };

    async function readNotification(notification) {
        await user.readNotification(notification.id);
        const dataCopy = [...data];
        dataCopy.find((n) => n.id === notification.id).read = true;
        setData(dataCopy);
        setUnreadNotificationCount((prev) => prev - 1);
    }

    return (
        <div className="notification-list-wrapper">
            <h3> Notifications </h3>
            <ul className="notification-list">
                {data.map((notification) => {
                    const Component = componentMap[notification.type];
                    return (
                        <li key={notification.id} onClick={onClick}>
                            <div className="notification-rows">
                                <div className="notification-date">
                                    {timeDifference(
                                        new Date(notification.createdAt)
                                    )}
                                </div>
                                <div className="notification-body">
                                    <Component notification={notification} />
                                    <button
                                        className="simple-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            readNotification(notification);
                                        }}
                                        disabled={notification.read}
                                    >
                                        <i className="bi bi-check-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function FriendRequestNotification({ notification }) {
    const [requestUser, setRequestUser] = useState(null);

    useEffect(() => {
        (async () => {
            const user = await getUser(notification.data.userId);
            setRequestUser(user);
        })();
    }, [notification]);

    return (
        requestUser && (
            <Link to={`/profile/${requestUser.id}`}>
                <div>
                    <img src={requestUser.profileImage} alt="profile picture" />
                </div>
                <div>
                    <b>
                        {requestUser.firstName} {requestUser.lastName}
                    </b>
                    {` ${
                        notification.type === "FRIEND_REQUEST"
                            ? "sent you a friend request!"
                            : "accepted your friend request!"
                    }`}
                </div>
            </Link>
        )
    );
}

function FriendPostedNotification({ notification }) {
    console.log(notification)
    const [friendPosted, setFriendPosted] = useState(null);

    useEffect(() => {
        (async () => {
            const user = await getUser(notification.data.userId);
            setFriendPosted(user);
        })();
    }, [notification]);

    return (
        friendPosted && (
            <Link to={`/post/${notification.data.postId}`}>
                <div>
                    <img src={friendPosted.profileImage} alt="profile picture" />
                </div>
                <div>
                    <b>
                       {`${friendPosted.firstName} ${friendPosted.lastName} `}
                    </b>
                    wrote a new post!
                </div>
            </Link>
        )
    );
    
}

function PostLikedNotification({ notification }) {
    return <div>Post liked - {notification.id} </div>;
}

function PostCommentedNotification({ notification }) {
    return <div>Post commented - {notification.id} </div>;
}
