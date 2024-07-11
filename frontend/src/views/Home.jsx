import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/User";

function Home() {
    const navigate = useNavigate();
    const user = useContext(UserContext);

    useEffect(() => {
        if (!user.isLoggedIn()) navigate("/login");
    }, []);

    return (
        <>
            <div className="container transparent">
                <h1>Home</h1>
                <p>Home page content</p>
                {JSON.stringify(user)}
            </div>
        </>
    );
}

export default Home;
