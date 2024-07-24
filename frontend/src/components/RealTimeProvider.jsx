import { useRef } from "react";
import { createSocket } from "../network";
import { RealTimeContext } from "../contexts";

export default function RealTimeProvider({ children }) {
    const socket = useRef(createSocket()).current;

    return socket ? (
        <RealTimeContext.Provider
            value={{
                onNewNotification: (func) =>
                    socket.on("NEW_NOTIFICATION", func),
                onNewMessage: (func) => socket.on("NEW_MESSAGE", func),
                offNewNotification: (func) =>
                    socket.off("NEW_NOTIFICATION", func),
                offNewMessage: (func) => socket.off("NEW_MESSAGE", func),
            }}
        >
            {children}
        </RealTimeContext.Provider>
    ) : 
    (
        <RealTimeContext.Provider
            value={{
                onNewNotification: () => {},
                onNewMessage: () => {},
                offNewNotification: () => {},
                offNewMessage: () => {},
            }}
        >
            {children}
        </RealTimeContext.Provider>
    );
}
