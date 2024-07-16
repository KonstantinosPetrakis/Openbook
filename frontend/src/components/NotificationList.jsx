import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/User";
import { getUser } from "../network";
import "../styles/NotificationList.css";

export default function NotificationList({ data, onClick }) {
    const user = readNotification(UserContext);

    const componentMap = {
        FRIEND_REQUEST: FriendRequestNotification,
        FRIEND_REQUEST_ACCEPTED: FriendRequestAcceptedNotification,
        FRIEND_POSTED: FriendPostedNotification,
        POST_LIKED: PostLikedNotification,
        POST_COMMENTED: PostCommentedNotification,
    };

    function readNotification(notification) {
        user.readNotification(notification.id);
        // update the UI somehow
    }
    
    return (
        <div className="notification-list-wrapper">
            <h3> Notifications </h3>
            <ul className="notification-list">
                {data.map((notification) => (
                    <li key={notification.id} onClick={onClick}>
                        {componentMap[notification.type]({ notification })}
                        <button className="simple-button" disabled={notification.read}>
                            <i className="bi bi-check-lg"></i>
                        </button>
                    </li>
                ))}
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
                    </b>{" "}
                    wants to be your friend!
                </div>
            </Link>
        )
    );
}

function FriendRequestAcceptedNotification({ notification }) {
    return <div>Friend request accepted - {notification.id} </div>;
}

function FriendPostedNotification({ notification }) {
    return <div>Friend posted - {notification.id} </div>;
}

function PostLikedNotification({ notification }) {
    return <div>Post liked - {notification.id} </div>;
}

function PostCommentedNotification({ notification }) {
    return <div>Post commented - {notification.id} </div>;
}
