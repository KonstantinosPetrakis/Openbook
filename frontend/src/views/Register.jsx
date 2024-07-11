import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/User";
import { PopUpContext } from "../contexts/PopUp";
import { camelToTitle, isEmailValid } from "../helpers";

export default function Login() {
    const user = useContext(UserContext);
    const popUp = useContext(PopUpContext);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        passwordVerification: "",
    });

    function validateForm() {
        if (
            !userData.firstName ||
            !userData.lastName ||
            !userData.email ||
            !userData.password ||
            !userData.passwordVerification
        ) {
            popUp("error", "Error", "Please fill in all fields.");
            return false;
        }

        if (!isEmailValid(userData.email)) {
            popUp("error", "Error", "Invalid email.");
            return false;
        }

        if (userData.password.length < 8) {
            popUp("error", "Error", "Password must be at least 8 characters.");
            return false;
        }

        if (userData.password !== userData.passwordVerification) {
            popUp("error", "Error", "Passwords do not match.");
            return false;
        }

        return true;
    }

    useEffect(() => {
        if (user && user.isLoggedIn()) navigate("/");
    }, [user, navigate]);

    const formFields = Object.keys(userData).map((field) => {
        return (
            <div key={field}>
                <label htmlFor={field}> {camelToTitle(field)} </label>
                <input
                    id={field}
                    type={
                        field.includes("password")
                            ? "password"
                            : field.includes("email")
                            ? "email"
                            : "text"
                    }
                    value={userData[field]}
                    onChange={(e) =>
                        setUserData({
                            ...userData,
                            [field]: e.target.value,
                        })
                    }
                />
            </div>
        );
    });

    return (
        <>
            <div className="container-small">
                <img className="logo" src="/images/logo.png" alt="logo" />
                <h1> Register </h1>
                <p className="secondary-text">
                    Enter your details to create an account.
                </p>

                <form>
                    <div className="transparent padded">{formFields}</div>
                    <Link className="small-link unstyled" to="/login">
                        Are you already a member?
                    </Link>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            if (!validateForm()) return;
                            if (
                                await user.register(
                                    userData.email,
                                    userData.firstName,
                                    userData.lastName,
                                    userData.password
                                )
                            )
                                navigate("/login");
                            else
                                popUp(
                                    "error",
                                    "Error",
                                    "Email already in use."
                                );
                        }}
                        className="primary-button"
                    >
                        Register
                    </button>
                </form>
            </div>
        </>
    );
}
