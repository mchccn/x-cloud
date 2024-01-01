import { Dispatch, SetStateAction } from "react";
import { TabManager } from "./components/TabManager";
import { TooltipContainer } from "./components/TooltipContainer";
import { TweetDisplay } from "./components/TweetDisplay";

export interface AppProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
    set_language: Dispatch<SetStateAction<string>>;
}

function App({ set_selection, set_tooltip, set_language }: AppProps) {
    return (
        <>
            <TabManager set_selection={set_selection} set_tooltip={set_tooltip} set_language={set_language} />
            <TweetDisplay />
            <TooltipContainer />
        </>
    );
}

export default App;
