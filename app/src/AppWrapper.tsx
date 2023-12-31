import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import { SelectionContext } from "./SelectionContext";
import { TooltipContext } from "./TooltipContext";

function AppWrapper() {
    const [selection, set_selection] = useState<{ language: string; selection: string } | undefined>(undefined);
    const [tooltip, set_tooltip] = useState<string | undefined>(undefined);

    return (
        <SelectionContext.Provider value={selection}>
            <TooltipContext.Provider value={tooltip}>
                <App set_selection={set_selection} set_tooltip={set_tooltip} />
                <ToastContainer />
            </TooltipContext.Provider>
        </SelectionContext.Provider>
    );
}

export default AppWrapper;
