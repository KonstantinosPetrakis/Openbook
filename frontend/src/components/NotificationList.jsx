import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import { timeDifference } from "../helpers";
import "../styles/NotificationList.css";

export default function NotificationList({ data, setData, onClick }) {
    const realTime = useContext(RealTimeContext);
    const user = useContext(UserContext);

    const componentMap = {
        FRIEND_REQUEST: FriendRequestNotification,
        FRIEND_REQUEST_ACCEPTED: FriendRequestNotification,
        FRIEND_POSTED: PostInteraction,
        POST_LIKED: PostInteraction,
        POST_COMMENTED: PostInteraction,
    };

    async function readNotification(notification) {
        await user.readNotification(notification.id);
        const dataCopy = [...data];
        dataCopy.find((n) => n.id === notification.id).read = true;
        setData(dataCopy);
        realTime.setUnreadNotificationCount((prev) => prev - 1);
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
    return (
        <Link to={`/profile/${notification.data.userId}`}>
            <div>
                <img
                    src={notification.data.profileImage}
                    alt="profile picture"
                />
            </div>
            <div>
                <b>
                    {notification.data.firstName} {notification.data.lastName}
                </b>
                {` ${
                    notification.type === "FRIEND_REQUEST"
                        ? "sent you a friend request!"
                        : "accepted your friend request!"
                }`}
            </div>
        </Link>
    );
}

function PostInteraction({ notification }) {
    return (
        <Link to={`/post/${notification.data.postId}`}>
            <div>
                <img
                    src={notification.data.profileImage}
                    alt="profile picture"
                />
            </div>
            <div>
                <b>{`${notification.data.firstName} ${notification.data.lastName} `}</b>
                {notification.type === "POST_LIKED"
                    ? "liked your post!"
                    : notification.type === "POST_COMMENTED"
                    ? "commented on your post!"
                    : "shared a new post!"}
            </div>
        </Link>
    );
}
