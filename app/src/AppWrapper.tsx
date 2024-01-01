import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import { DataContext, ResponseData } from "./contexts/DataContext";
import { LanguageContext } from "./contexts/LanguageContext";
import { SelectionContext } from "./contexts/SelectionContext";
import { TooltipContext } from "./contexts/TooltipContext";

function AppWrapper() {
    const [selection, set_selection] = useState<{ language: string; selection: string } | undefined>(undefined);
    const [tooltip, set_tooltip] = useState<string | undefined>(undefined);
    const [language, set_language] = useState("english");

    const [data, set_data] = useState<Record<string, ResponseData>>({});

    useEffect(() => {
        Promise.all([
            fetch("english.json").then((res) => res.json()),
            fetch("chinese.json").then((res) => res.json()),
        ]).then(([english, chinese]) => {
            set_data({ english, chinese });
        });
    }, []);

    return (
        <SelectionContext.Provider value={selection}>
            <TooltipContext.Provider value={tooltip}>
                <LanguageContext.Provider value={language}>
                    <DataContext.Provider value={data}>
                        <App set_selection={set_selection} set_tooltip={set_tooltip} set_language={set_language} />
                        <ToastContainer />
                    </DataContext.Provider>
                </LanguageContext.Provider>
            </TooltipContext.Provider>
        </SelectionContext.Provider>
    );
}

export default AppWrapper;
