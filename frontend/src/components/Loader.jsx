import { useState, useEffect, useRef } from "react";
import "../styles/Loader.css";

export default function Loader({
    Renderer,
    fetchFunction,
    reverse = false,
    className = "",
    onClick = () => {},
}) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [stopLoading, setStopLoading] = useState(false);
    const obs = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) =>
            entries.forEach(
                (e) =>
                    e.intersectionRatio > 0 &&
                    !stopLoading &&
                    setPage((p) => p + 1)
            )
        );
        if (obs.current) observer.observe(obs.current);
        return () => observer.disconnect();
    }, [data, stopLoading]);

    useEffect(() => {
        (async () => {
            const d = await fetchFunction(page);
            setStopLoading(d.length === 0);
            // Normally ids are unique, but the filtering is required to prevent
            // errors happening due to strict mode during development.
            setData((data) => {
                const dataIds = data.map((d) => d.id);
                const filteredD = d.filter((d) => !dataIds.includes(d.id));
                return reverse
                    ? [...filteredD, ...data]
                    : [...data, ...filteredD];
            });
        })();
    }, [fetchFunction, page, reverse]);

    return (
        !!data.length && (
            <div className={`loader ${className}`}>
                {reverse && (
                    <div ref={obs}>
                        {/* The br is required to trigger observer correctly */}
                        <br />
                    </div>
                )}
                <Renderer data={data} setData={setData} onClick={onClick} />
                {!reverse && (
                    <div ref={obs}>
                        {/* The br is required to trigger observer correctly */}
                        <br />
                    </div>
                )}
            </div>
        )
    );
}
