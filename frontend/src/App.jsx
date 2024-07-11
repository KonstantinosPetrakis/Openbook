import { Routes, Route } from "react-router-dom";
import Home from "./views/Home";
import Login from "./views/Login";
import Register from "./views/Register";
import UserProvider from "./components/UserProvider";
import PopUpProvider from "./components/PopUpProvider";

function App() {
    return (
        <UserProvider>
            <PopUpProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </PopUpProvider>
        </UserProvider>
    );
}

export default App;
