import { useContext, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./contexts/User";
import Home from "./views/Home";
import Login from "./views/Login";
import Register from "./views/Register";
import UserProvider from "./components/UserProvider";
import PopUpProvider from "./components/PopUpProvider";
import NavBar from "./components/NavBar";
import Menu from "./components/Menu";
import Profile from "./views/Profile";
import Me from "./views/Me";
import NotFound from "./views/NotFound";
import "./styles/App.css";

function App() {
    return (
        <UserProvider>
            <PopUpProvider>
                <NavBar />
                <div className="basic-container">
                    <ApplicationRoutes />
                </div>
                <Menu />
            </PopUpProvider>
        </UserProvider>
    );
}

function ApplicationRoutes() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useContext(UserContext);

    useEffect(() => {
        if (
            !user.isLoggedIn() &&
            !["/login", "/register"].includes(location.pathname)
        )
            navigate("/login");
        else if (
            user.isLoggedIn() &&
            ["/login", "/register"].includes(location.pathname)
        )
            navigate("/");
    }, [user, location, navigate]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/me" element={<Me />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
