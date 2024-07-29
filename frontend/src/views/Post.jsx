import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts";
import PostComponent from "../components/Post";

export default function Post() {
    const [post, setPost] = useState(null);
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const { id } = useParams();
    
    useEffect(() => {
        (async () => {
            const p = await user.getPost(id);
            if (!p) navigate("/404");
            else setPost(p);
        })();
    }, [user, id, navigate]);

    return (
        post && (
            <div className="container-lg ">
                <PostComponent post={post} />
            </div>
        )
    );
}
