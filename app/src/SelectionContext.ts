import { createContext } from "react";

export const SelectionContext = createContext<{ language: string; selection: string } | undefined>(undefined);
