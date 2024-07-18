import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { UserContext } from "../contexts";
import PostComponent from "../components/Post";

export default function Post() {
    const [post, setPost] = useState(null);
    const user = useContext(UserContext);
    const { id } = useParams();

    useEffect(() => {
        (async () => {
            setPost(await user.getPost(id));
        })();
    }, [user, id]);

    return (
        post && (
            <div className="container-lg ">
                <PostComponent post={post} />
            </div>
        )
    );
}
