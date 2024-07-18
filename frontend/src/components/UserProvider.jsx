/**
 * In order to have up to date information about the user all the time, only the
 * access token and id of user are stored in the local storage.
 * The user information is fetched from the server every time the page is loaded.
 */

import { useEffect, useState } from "react";
import { UserContext } from "../contexts";
import {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    addFriend,
    deleteFriend,
    readNotification,
    getNotifications,
    getFriends,
    getUnreadNotificationCount,
    createPost,
    getPost,
} from "../network";

export default function UserProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userMethods = {
            register: registerUser,
            login: async (email, password) => {
                const u = await loginUser(email, password);
                if (!u) return false;
                localStorage.setItem("user", JSON.stringify(u));
                refreshUser();
                return true;
            },
            update: async (data) => {
                const r = await updateUser(data);
                await refreshUser();
                return r;
            },
            logout: () => {
                localStorage.removeItem("user");
                refreshUser();
            },
            isLoggedIn: () => {
                return !!localStorage.getItem("user");
            },
            getFriends,
            addFriend,
            deleteFriend,
            getNotifications,
            readNotification,
            getUnreadNotificationCount,
            createPost,
            getPost,
        };

        const refreshUser = async () => {
            let u = localStorage.getItem("user");
            let parsedU = JSON.parse(u);

            if (!u) setUser(userMethods);
            else {
                setUser({
                    ...parsedU,
                    ...(await getUser(parsedU.id)),
                    ...userMethods,
                });
            }
        };

        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={user}>
            {user && children}
        </UserContext.Provider>
    );
}
