import { useState, useContext, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Loader from "../components/Loader";
import PostList from "../components/PostList";
import { UserContext } from "../contexts";
import { camelToTitle } from "../helpers";
import { PROFILE_ICONS, GENDER, RELATIONSHIP_STATUS } from "../constants";
import "../styles/Profile.css";

export default function Profile() {
    const sessionUser = useContext(UserContext);
    const [user, setUser] = useState(null);
    const [rerenderSwitch, setRerenderswitch] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const u = await sessionUser.getUser(id);
            if (!u) navigate("/not-found");
            u.relationshipStatus = RELATIONSHIP_STATUS[u.relationshipStatus];
            u.gender = GENDER[u.gender];
            setUser(u);
        })();
    }, [navigate, id, rerenderSwitch, sessionUser]);

    const positiveFunction = async () =>
        (await sessionUser.addFriend(user.id)) &&
        setRerenderswitch(!rerenderSwitch);

    const negativeFunction = async () =>
        (await sessionUser.deleteFriend(user.id)) &&
        setRerenderswitch(!rerenderSwitch);

    const profileControls = {
        stranger: { text: "Add Friend", func: positiveFunction },
        requested: { text: "Cancel Request", func: negativeFunction },
        received: { text: "Accept Request", func: positiveFunction },
        friend: { text: "Unfriend", func: negativeFunction },
    };

    return (
        user && (
            <div className="container-xlarge">
                <div className="profile-background">
                    <img src={user.backgroundImage} alt="profile background" />
                </div>
                <div className="profile-basic">
                    <div className="profile-image">
                        <img src={user.profileImage} alt="profile image" />
                    </div>
                    <h2>
                        {user.firstName} {user.lastName}
                    </h2>
                    <div className="profile-controls">
                        {sessionUser.id === user.id ? (
                            <Link className="transparent-button" to="/me">
                                Edit Profile
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={
                                        profileControls[user.friendshipStatus]
                                            .func
                                    }
                                    className="transparent-button"
                                >
                                    {
                                        profileControls[user.friendshipStatus]
                                            .text
                                    }
                                </button>
                                <Link
                                    className="transparent-button"
                                    to={`/chat/${user.id}`}
                                >
                                    Message
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="dual-column">
                    <div className="transparent user-information">
                        <h3> User Information </h3>
                        {Object.entries(PROFILE_ICONS)
                            .filter(([field]) => !field.includes("password"))
                            .map(([field, icon]) => (
                                <div key={field}>
                                    <i className={icon}></i>
                                    {camelToTitle(field)}
                                    <p>
                                        {user[field] ||
                                            `${camelToTitle(
                                                field
                                            )} not provided.`}
                                    </p>
                                </div>
                            ))}
                    </div>
                    <div className="posts">
                        <Loader
                            key={user.id}
                            Renderer={PostList}
                            fetchFunction={(p) =>
                                sessionUser.getPostsOfUser(user.id, p)
                            }
                        />
                    </div>
                </div>
            </div>
        )
    );
}
