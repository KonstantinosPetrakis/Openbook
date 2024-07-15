import { useState, useEffect, useRef } from "react";
import "../styles/Loader.css";

export default function Loader({
    Renderer,
    fetchFunction,
    reverse = false,
    className = "",
}) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [stopLoading, setStopLoading] = useState(false);
    const obs = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(() =>
            setPage((prevPage) => (stopLoading ? prevPage : prevPage + 1))
        );
        observer.observe(obs.current);
        return () => observer.disconnect();
    }, [stopLoading]);

    useEffect(() => {
        (async () => {
            const d = await fetchFunction(page);
            setStopLoading(d.length === 0);
            setData((data) => (reverse ? [...d, ...data] : [...data, ...d]));
        })();
    }, [fetchFunction, page, reverse]);

    return (
        data && (
            <div className={`loader ${className}`}>
                {reverse && <div ref={obs}></div>}
                <Renderer data={data} />
                {!reverse && <div ref={obs}> </div>}
            </div>
        )
    );
}
