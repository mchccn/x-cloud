import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { Tweet } from "react-tweet";
import { SelectionContext } from "./SelectionContext";
import { TooltipContext } from "./TooltipContext";
import { WordCloudTab } from "./components/WordCloudTab";

export interface AppProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
}

function App({ set_selection, set_tooltip }: AppProps) {
    const selection = useContext(SelectionContext);
    const tooltip = useContext(TooltipContext);

    const [tweets, set_tweets] = useState<string[]>([]);

    const tooltipRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (tooltipRef.current) {
                tooltipRef.current.style.left = e.pageX + "px";
                tooltipRef.current.style.top = e.pageY - 25 + "px";

                tooltipRef.current.style.opacity = "1";
            }
        };

        document.body.addEventListener("mousemove", handler);

        return () => document.body.removeEventListener("mousemove", handler);
    });

    useEffect(() => {
        if (!selection) return;

        fetch(
            `api/${selection.language}/${selection.selection
                .split("")
                .map((c) => c.codePointAt(0))
                .join("-")}.json`
        )
            .then((res) => res.json())
            .then((tweets) => set_tweets(tweets));
    }, [selection]);

    return (
        <>
            <WordCloudTab set_selection={set_selection} set_tooltip={set_tooltip} />
            <article className="border-l-2 border-x-neutral-100 p-4 overflow-scroll min-w-[432px] w-[432px] max-w-[432px]">
                {selection ? (
                    <>
                        <h1>results for {selection.selection}:</h1>
                        {tweets.map((id) => (
                            <Tweet key={id} id={id} />
                        ))}
                    </>
                ) : (
                    <p>click a word</p>
                )}
            </article>
            {tooltip ? (
                <div
                    ref={tooltipRef}
                    className="tooltip absolute pointer-events-none p-1 bg-white border border-neutral-300 rounded-sm opacity-0"
                >
                    <p>{tooltip}</p>
                </div>
            ) : null}
        </>
    );
}

export default App;
