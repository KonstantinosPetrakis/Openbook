import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { UserContext } from "../contexts";
import { createSocket } from "../network";
import { RealTimeContext } from "../contexts";

export default function RealTimeProvider({ children }) {
    const user = useContext(UserContext);
    const alertAudio = useRef(null);
    const [socket, setSocket] = useState(null);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [messageCreatedCallbacks, setMessageCreatedCallbacks] = useState([]);

    const onNewNotification = useCallback(
        (func) => socket && socket.on("NEW_NOTIFICATION", func),
        [socket]
    );

    const onNewMessage = useCallback(
        (func) => socket && socket.on("NEW_MESSAGE", (func)),
        [socket]
    );

    const offNewNotification = useCallback(
        (func) => socket && socket.off("NEW_NOTIFICATION", func),
        [socket]
    );

    const offNewMessage = useCallback(
        (func) => socket && socket.off("NEW_MESSAGE", func),
        [socket]
    );

    const onMessageCreated = useCallback(
        (func) => setMessageCreatedCallbacks((c) => [...c, func]),
        []
    );

    const offMessageCreated = useCallback(
        (func) =>
            setMessageCreatedCallbacks((c) => c.filter((f) => f !== func)),
        []
    );

    const messageCreated = useCallback(
        (m) => messageCreatedCallbacks.forEach((f) => f(m)),
        [messageCreatedCallbacks]
    );

    // Reconnect socket when user changes
    useEffect(() => {
        setSocket(createSocket());
        return () =>
            setSocket((s) => {
                if (s && s.connected) s.close();
                return null;
            });
    }, [user]);

    // Get unread notification and message count when user changes
    useEffect(() => {
        (async () => {
            setUnreadNotificationCount(await user.getUnreadNotificationCount());
            setUnreadMessageCount(await user.getUnreadMessageCount());
        })();
    }, [user]);

    // Listen for new notifications and update unread notification count
    useEffect(() => {
        const onNewNotificationHandler = () => {
            alertAudio.current.currentTime = 0;
            alertAudio.current.play();
            setUnreadNotificationCount((c) => c + 1);
        };
        onNewNotification(onNewNotificationHandler);
        return () => offNewNotification(onNewNotificationHandler);
    }, [onNewNotification, offNewNotification]);

    // Listen for new messages and update unread message count
    useEffect(() => {
        const onNewMessageHandler = () => {
            alertAudio.current.currentTime = 0;
            alertAudio.current.play();
            setUnreadMessageCount((c) => c + 1);
        };
        onNewMessage(onNewMessageHandler);
        return () => offNewMessage(onNewMessageHandler);
    }, [onNewMessage, offNewMessage]);

    return (
        <RealTimeContext.Provider
            value={{
                onNewNotification,
                onNewMessage,
                offNewNotification,
                offNewMessage,
                setUnreadNotificationCount,
                setUnreadMessageCount,
                onMessageCreated,
                offMessageCreated,
                messageCreated,
                unreadNotificationCount,
                unreadMessageCount,
            }}
        >
            <audio ref={alertAudio} src="/audio/alert.mp3"></audio>
            {children}
        </RealTimeContext.Provider>
    );
}
