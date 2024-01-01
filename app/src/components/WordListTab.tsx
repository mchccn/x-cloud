import { Dispatch, SetStateAction, useContext } from "react";
import { colors } from "../constants";
import { DataContext } from "../contexts/DataContext";
import { LanguageContext } from "../contexts/LanguageContext";
import { SelectionContext } from "../contexts/SelectionContext";

export interface WordListTabProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
    set_language: Dispatch<SetStateAction<string>>;
}

export function WordListTab({ set_selection, set_tooltip, set_language }: WordListTabProps) {
    const language = useContext(LanguageContext);
    const selection = useContext(SelectionContext);
    const data = useContext(DataContext);

    return (
        <section className="flex-1 h-full w-full overflow-scroll flex flex-col">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl pl-8 pt-6 pb-4 flex gap-2 items-center">
                    <span>top results for</span>
                    <select
                        className="border rounded px-1 py-0.5"
                        onChange={(e) => set_language(e.target.value)}
                        value={language}
                    >
                        {Object.keys(data).map((lang) => (
                            <option key={lang} value={lang}>
                                {lang}
                            </option>
                        ))}
                    </select>
                </h1>
            </header>
            <div className="flex-1 overflow-scroll">
                <table
                    className="px-6 pb-6 w-full grid"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(256px, 1fr))" }}
                >
                    {[...data[language].svg.words]
                        .sort((a, b) => b.value - a.value)
                        .map((word, i) => (
                            <tr key={word.text} className="flex items-center">
                                <td className="p-2 text-neutral-400">{(i + 1).toString().padStart(3, "0")}</td>
                                <td className="p-2 text-neutral-700">{word.value.toString().padStart(2, "0")}</td>
                                <td
                                    onClick={() =>
                                        set_selection(
                                            selection === word.text
                                                ? undefined
                                                : {
                                                      language,
                                                      selection: word.text!,
                                                  }
                                        )
                                    }
                                    className="m-2 text-xl cursor-pointer"
                                    style={{ fontFamily: "Impact", color: colors[i % colors.length] }}
                                >
                                    {word.text}
                                </td>
                            </tr>
                        ))}
                </table>
            </div>
        </section>
    );
}
