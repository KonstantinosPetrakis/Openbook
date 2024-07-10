import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/User";

export default function Login() {
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (user && user.isLoggedIn()) navigate("/");
    }, [user]);

    return (
        <>
            <div className="container-small">
                <img className="logo" src="/images/logo.png" alt="logo" />
                <h1> Login </h1>
                <p className="secondary-text">
                    We're so excited to see you again!
                </p>

                <form>
                    <div className="transparent padded">
                        <div>
                            <label htmlFor="email"> Email </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password"> Password </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <a className="small-link unstyled" href="">
                        Forgot Password?
                    </a>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            user.login(email, password);
                        }}
                        className="primary-button"
                    >
                        Login
                    </button>
                </form>
            </div>
        </>
    );
}
