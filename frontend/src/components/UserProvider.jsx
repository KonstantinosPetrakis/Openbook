/**
 * In order to have up to date information about the user all the time, only the
 * access token and id of user are stored in the local storage.
 * The user information is fetched from the server every time the page is loaded.
 */

import { useState } from "react";
import { useMountEffect } from "../hooks/mount";
import { UserContext } from "../contexts/User";
import { registerUser, loginUser, getUser, updateUser } from "../network";

export default function UserProvider({ children }) {
    const [user, setUser] = useState(null);

    const userMethods = {
        register: registerUser,
        login: async (email, password) => {
            const u = await loginUser(email, password);
            if (!u) return false;
            localStorage.setItem("user", JSON.stringify(u));
            refreshUser();
            return true;
        },
        update: async () => {
            await updateUser(user);
            refreshUser();
        },
        logout: () => {
            localStorage.removeItem("user");
            refreshUser();
        },
        isLoggedIn: () => {
            return !!localStorage.getItem("user");
        },
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

    useMountEffect(() => {
        refreshUser();
    });

    return (
        <UserContext.Provider value={user}>
            {user && children}
        </UserContext.Provider>
    );
}
