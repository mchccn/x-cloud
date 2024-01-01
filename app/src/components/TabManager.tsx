import { Dispatch, SetStateAction, useContext, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import { WordCloudTab } from "./WordCloudTab";
import { WordListTab } from "./WordListTab";

export interface TabManagerProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
    set_language: Dispatch<SetStateAction<string>>;
}

const TAB_COMPONENTS = {
    word_cloud: WordCloudTab,
    word_list: WordListTab,
};

export function TabManager({ set_selection, set_tooltip, set_language }: TabManagerProps) {
    const [tab, set_tab] = useState<keyof typeof TAB_COMPONENTS>("word_cloud");
    const data = useContext(DataContext);

    const Component = TAB_COMPONENTS[tab];

    return (
        <main className="flex flex-col flex-1">
            <header className="flex flex-row">
                {Object.keys(TAB_COMPONENTS).map((key) => (
                    <button
                        onClick={() => set_tab(key as keyof typeof TAB_COMPONENTS)}
                        key={key}
                        className={`px-6 py-2 border-r-2 border-r-neutral-100 grid place-items-center hover:bg-neutral-50 ${
                            tab === key ? "border-b-2 border-b-white" : "border-b-2 border-b-neutral-100"
                        }`}
                    >
                        <p className={`${tab === key ? "" : "text-neutral-400"}`}>{key.replaceAll("_", " ")}</p>
                    </button>
                ))}
                <div className="flex-1 border-b-2 border-neutral-100"></div>
            </header>
            {Object.keys(data).length ? (
                <Component set_selection={set_selection} set_tooltip={set_tooltip} set_language={set_language} />
            ) : (
                <section className="flex-1">
                    <div className="h-full grid place-items-center">
                        <p>loading...</p>
                    </div>
                </section>
            )}
        </main>
    );
}
