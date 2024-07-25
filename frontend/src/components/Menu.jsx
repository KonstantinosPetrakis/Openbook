import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext, RealTimeContext } from "../contexts";
import OffCanvas from "../components/OffCanvas";
import CreatePost from "./CreatePost";
import NotificationList from "./NotificationList";
import Loader from "./Loader";
import "../styles/Menu.css";

export default function Menu() {
    const user = useContext(UserContext);
    const realTime = useContext(RealTimeContext);
    const [notificationListActive, setNotificationListActive] = useState(false);
    const [createPostActive, setCreatePostActive] = useState(false);
    const [notificationRefresh, setNotificationRefresh] = useState(false);

    useEffect(() => {
        const onNewNotification = () => setNotificationRefresh((r) => !r);
        realTime.onNewNotification(onNewNotification);
        return () => realTime.offNewNotification(onNewNotification);
    }, [realTime]);

    return (
        user.isLoggedIn() && (
            <nav className="menu">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 320"
                    preserveAspectRatio="none"
                >
                    <path
                        fill="currentColor"
                        d="M0,64L120,90.7C240,117,480,171,720,165.3C960,160,1200,96,1320,64L1440,32L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"
                    ></path>
                </svg>
                <ul>
                    <li>
                        <Link className="simple-button" to="/">
                            <i className="bi bi-house"></i>
                            <div> Home </div>
                        </Link>
                    </li>
                    <li>
                        <Link
                            className="message-button simple-button"
                            to={"/chat"}
                        >
                            {!!realTime.unreadMessageCount && (
                                <div className="pill">
                                    {realTime.unreadMessageCount}
                                </div>
                            )}
                            <i className="bi bi-chat-left-text"></i>
                            <div> Chat </div>
                        </Link>
                    </li>
                    <li>
                        <button
                            className="special-button"
                            onClick={() => setCreatePostActive((c) => !c)}
                        >
                            <i className="bi bi-plus"></i>
                        </button>
                        <OffCanvas
                            title="Create a post"
                            open={createPostActive}
                            closeFunc={() => setCreatePostActive(false)}
                        >
                            <CreatePost />
                        </OffCanvas>
                    </li>
                    <li>
                        <Loader
                            key={notificationRefresh}
                            className={`list notification-loader ${
                                notificationListActive ? "active" : ""
                            }`}
                            Renderer={NotificationList}
                            fetchFunction={user.getNotifications}
                            onClick={() => setNotificationListActive(false)}
                        />
                        <button
                            className="notification-button simple-button"
                            onClick={() => setNotificationListActive((c) => !c)}
                        >
                            <i className="bi bi-bell"></i>
                            <div> Notifications </div>
                            {!!realTime.unreadNotificationCount && (
                                <div className="pill">
                                    {realTime.unreadNotificationCount}
                                </div>
                            )}
                        </button>
                    </li>
                    <li>
                        <Link
                            className="simple-button"
                            to={`/profile/${user.id}`}
                        >
                            <i className="bi bi-person"></i>
                            <div> Profile </div>
                        </Link>
                    </li>
                </ul>
            </nav>
        )
    );
}
