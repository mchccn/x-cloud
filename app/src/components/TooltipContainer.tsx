import { useContext, useEffect, useRef } from "react";
import { TooltipContext } from "../contexts/TooltipContext";

export function TooltipContainer() {
    const tooltip = useContext(TooltipContext);

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

    if (!tooltip) return null;

    return (
        <div
            ref={tooltipRef}
            className="tooltip absolute pointer-events-none p-1 bg-white border border-neutral-300 rounded-sm opacity-0"
        >
            <p>{tooltip}</p>
        </div>
    );
}
