import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/User";
import { PopUpContext } from "../contexts/PopUp";
import { isEmailValid } from "../helpers";

export default function Login() {
    const user = useContext(UserContext);
    const popUp = useContext(PopUpContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function validateForm() {
        if (!email || !password) {
            popUp("error", "Error", "Please fill in all fields.");
            return false;
        }

        if (!isEmailValid(email)) {
            popUp("error", "Error", "Invalid email.");
            return false;
        }

        return true;
    }

    useEffect(() => {
        if (user && user.isLoggedIn()) navigate("/");
    }, [user, navigate]);

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
                    <Link className="small-link unstyled" to="">
                        Forgot Password?
                    </Link>
                    <Link className="small-link unstyled" to="/register">
                        Don't have an account?
                    </Link>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            if (!validateForm()) return;
                            if (await user.login(email, password))
                                navigate("/");
                            else
                                popUp(
                                    "error",
                                    "Error",
                                    "Invalid email or password."
                                );
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
