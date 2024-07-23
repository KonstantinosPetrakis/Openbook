import { useContext, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserContext, RealTimeContext, notificationContext } from "../contexts";
import OffCanvas from "../components/OffCanvas";
import CreatePost from "./CreatePost";
import NotificationList from "./NotificationList";
import Loader from "./Loader";
import "../styles/Menu.css";

export default function Menu() {
    const user = useContext(UserContext);
    const realTime = useContext(RealTimeContext);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationListActive, setNotificationListActive] = useState(false);
    const [createPostActive, setCreatePostActive] = useState(false);
    const [refreshNotification, setRefreshNotification] = useState(false);
    const alertAudio = useRef(null);

    useEffect(() => {
        if (!realTime) return;

        const refNot = () => {
            setRefreshNotification((prev) => !prev);
            alertAudio.current.play();
        };
        realTime.onNewNotification(refNot);
        return () => realTime.offNewNotification(refNot);
    }, [realTime]);

    useEffect(() => {
        (async () => {
            if (!user.isLoggedIn()) return;
            setUnreadNotificationCount(await user.getUnreadNotificationCount());
        })();
    }, [user, refreshNotification]);

    return (
        user.isLoggedIn() && (
            <nav className="menu">
                <audio ref={alertAudio} src="/audio/alert.mp3"></audio>
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
                        <Link className="simple-button" to={"/chat"}>
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
                    <li
                        key={refreshNotification}
                        className="notification-button"
                    >
                        <notificationContext.Provider
                            value={setUnreadNotificationCount}
                        >
                            <Loader
                                className={`list notification-loader ${
                                    notificationListActive ? "active" : ""
                                }`}
                                Renderer={NotificationList}
                                fetchFunction={user.getNotifications}
                                onClick={() => setNotificationListActive(false)}
                            />
                        </notificationContext.Provider>
                        {!!unreadNotificationCount && (
                            <div className="pill">
                                {unreadNotificationCount}
                            </div>
                        )}
                        <button
                            className="simple-button"
                            onClick={() => setNotificationListActive((c) => !c)}
                        >
                            <i className="bi bi-bell"></i>
                            <div> Notifications </div>
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
