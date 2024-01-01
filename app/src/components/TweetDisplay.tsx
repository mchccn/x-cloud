import { useContext, useEffect, useState } from "react";
import { Tweet } from "react-tweet";
import { Tweet as TweetData } from "react-tweet/api";
import { SelectionContext } from "../contexts/SelectionContext";

const SORT_FUNCTIONS = {
    newest: (a: TweetData, b: TweetData) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    oldest: (a: TweetData, b: TweetData) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    most_likes: (a: TweetData, b: TweetData) => b.favorite_count - a.favorite_count,
    least_likes: (a: TweetData, b: TweetData) => a.favorite_count - b.favorite_count,
    most_replies: (a: TweetData, b: TweetData) => b.conversation_count - a.conversation_count,
    least_replies: (a: TweetData, b: TweetData) => a.conversation_count - b.conversation_count,
};

export function TweetDisplay() {
    const selection = useContext(SelectionContext);
    const [tweets, set_tweets] = useState<TweetData[]>([]);

    const [sort_by, set_sort_by] = useState<keyof typeof SORT_FUNCTIONS>("newest");

    useEffect(() => {
        if (!selection) return;

        fetch(
            `api/${selection.language}/${selection.selection
                .split("")
                .map((c) => c.codePointAt(0))
                .join("-")}.json`
        )
            .then((res) => res.json())
            .then((json) => set_tweets(json));
    }, [selection]);

    return (
        <article className="border-l-2 border-x-neutral-100 p-4 overflow-scroll min-w-[432px] w-[432px] max-w-[432px]">
            {selection ? (
                <>
                    <div className="flex justify-between">
                        <h1>results for {selection.selection}:</h1>
                        <div>
                            sort by{" "}
                            <select
                                className="border rounded-sm"
                                value={sort_by}
                                onChange={(e) => set_sort_by(e.target.value as keyof typeof SORT_FUNCTIONS)}
                            >
                                {Object.keys(SORT_FUNCTIONS).map((key) => (
                                    <option key={key} value={key}>
                                        {key.replaceAll("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {[...tweets].sort(SORT_FUNCTIONS[sort_by]).map((t) => (
                        <Tweet key={t.id_str} id={t.id_str} />
                    ))}
                </>
            ) : (
                <p>click a word</p>
            )}
        </article>
    );
}
