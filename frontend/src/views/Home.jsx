import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts";

function Home() {
    const user = useContext(UserContext);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        (async () => setFriends(await user.getFriends()))();
    }, [user]);

    return (
        <>
            <h2> This is the homepage! </h2>
            {JSON.stringify(friends, null, 2)}
        </>
    );
}

export default Home;
