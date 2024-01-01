import { Word } from "d3-cloud";
import { createContext } from "react";

export type ResponseData = {
    language: string;
    svg: {
        width: number;
        height: number;
        words: (Word & { value: number })[];
    };
};

export const DataContext = createContext<Record<string, ResponseData>>({});
