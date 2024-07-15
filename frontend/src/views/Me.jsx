import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/User";
import { PopUpContext } from "../contexts/PopUp";
import { camelToTitle } from "../helpers";
import UploadedImage from "../components/UploadedImage";
import ChoiceInput from "../components/ChoiceInput";
import "../styles/Profile.css";
import "../styles/Me.css";
import { GENDER, RELATIONSHIP_STATUS, PROFILE_ICONS } from "../constants";
import { isEmailValid } from "../helpers";

export default function Me() {
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const popUp = useContext(PopUpContext);
    const [userData, setUserData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender || "",
        relationshipStatus: user.relationshipStatus || "",
        bio: user.bio,
        location: user.location,
        occupation: user.occupation,
        education: user.education,
        hobbies: user.hobbies,
        backgroundImage: user.backgroundImage,
        profileImage: user.profileImage,
        password: "",
        passwordConfirmation: "",
    });

    async function updateUser() {
        const data = { ...userData };

        if (data.password !== data.passwordConfirmation) {
            popUp("error", "Error", "Passwords do not match.");
            return;
        }

        if (data.password && data.password.length < 8) {
            popUp("error", "Error", "Password must be at least 8 characters.");
            return;
        }

        if (data.email && !isEmailValid(data.email)) {
            popUp("error", "Error", "Invalid email address.");
            return;
        }

        delete data.passwordConfirmation;

        for (let key of Object.keys(data)) {
            if (
                data[key] === user[key] ||
                (data[key] === "" && !user[key]) || // null values are casted to empty strings so react doesn't complain
                data[key] === "/images/default-background.png" ||
                data[key] === "/images/default-profile.png"
            )
                delete data[key];
        }

        if (Object.keys(data).length === 0) {
            popUp("warning", "Warning", "No changes detected.");
            return;
        }

        if (await user.update(data)) navigate(`/profile/${user.id}`);
        else popUp("error", "Error", "Email already in use.");
    }

    function createEditableField(field) {
        return (
            <label className="editable-field">
                {camelToTitle(field)}
                <i className={PROFILE_ICONS[field]}></i>
                <input
                    type={
                        field === "email"
                            ? "email"
                            : field.includes("password")
                            ? "password"
                            : "text"
                    }
                    value={userData[field]}
                    onChange={(e) =>
                        setUserData({
                            ...userData,
                            [field]: e.target.value,
                        })
                    }
                    placeholder={`Your ${camelToTitle(field).toLowerCase()}`}
                />
            </label>
        );
    }

    return (
        <div className="container-xlarge">
            <UploadedImage
                className="profile-background"
                src={userData.backgroundImage}
                setSrc={(src) =>
                    setUserData({ ...userData, backgroundImage: src })
                }
                aspectRatio={3}
            />
            <div className="profile-basic">
                <UploadedImage
                    className="profile-image"
                    src={userData.profileImage}
                    setSrc={(src) =>
                        setUserData({ ...userData, profileImage: src })
                    }
                    aspectRatio={1}
                />
                <div className="editable-names">
                    <input
                        type="text"
                        value={userData.firstName}
                        onChange={(e) =>
                            setUserData({
                                ...userData,
                                firstName: e.target.value,
                            })
                        }
                    />
                    <input
                        type="text"
                        value={userData.lastName}
                        onChange={(e) =>
                            setUserData({
                                ...userData,
                                lastName: e.target.value,
                            })
                        }
                    />
                </div>
                <div className="profile-controls">
                    <button className="transparent-button" onClick={updateUser}>
                        Save Changes
                    </button>
                </div>
            </div>
            <div className="dual-column">
                <div className="transparent user-information">
                    <h3> User Information </h3>
                    {createEditableField("email")}
                    {createEditableField("password")}
                    {createEditableField("passwordConfirmation")}
                    <label className="editableField">
                        Relationship Status
                        <i className={PROFILE_ICONS.relationshipStatus}></i>
                        <ChoiceInput
                            value={userData.relationshipStatus}
                            setValue={(v) =>
                                setUserData({
                                    ...userData,
                                    relationshipStatus: v,
                                })
                            }
                            options={RELATIONSHIP_STATUS}
                        />
                    </label>
                    <label className="editableField">
                        Gender
                        <i className={PROFILE_ICONS.gender}></i>
                        <ChoiceInput
                            value={userData.gender}
                            setValue={(v) =>
                                setUserData({ ...userData, gender: v })
                            }
                            options={GENDER}
                        />
                    </label>
                    <label className="editableField">
                        Bio
                        <i className={PROFILE_ICONS.bio}></i>
                        <textarea
                            value={userData.bio}
                            onChange={(e) =>
                                setUserData({
                                    ...userData,
                                    bio: e.target.value,
                                })
                            }
                            placeholder="Your bio..."
                        ></textarea>
                    </label>
                    {createEditableField("location")}
                    {createEditableField("occupation")}
                    {createEditableField("education")}
                    {createEditableField("hobbies")}
                </div>
                <div className="transparent posts">Posts go here</div>
            </div>
        </div>
    );
}
