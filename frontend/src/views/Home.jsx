import { useContext } from "react";
import { UserContext } from "../contexts";
import Loader from "../components/Loader";
import PostList from "../components/PostList";

function Home() {
    const user = useContext(UserContext);

    return (
        <div className="container-lg home">
            <Loader
                Renderer={PostList}
                DefaultRenderer={() => (
                    <p>
                        Your feed is empty! Create new friends to get an
                        interesting feed!
                    </p>
                )}
                fetchFunction={user.getFeed}
            />
        </div>
    );
}

export default Home;
