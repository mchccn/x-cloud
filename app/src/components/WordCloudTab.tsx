import { Dispatch, SetStateAction, useContext } from "react";
import { toast } from "react-toastify";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { colors } from "../constants";
import { DataContext, ResponseData } from "../contexts/DataContext";
import { LanguageContext } from "../contexts/LanguageContext";
import { SelectionContext } from "../contexts/SelectionContext";

export interface WordCloudTabProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
    set_language: Dispatch<SetStateAction<string>>;
}

const ctx = document.createElement("canvas").getContext("2d")!;

function create_svg(
    data: ResponseData,
    selection: { language: string; selection: string } | undefined,
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>,
    set_tooltip: Dispatch<SetStateAction<string | undefined>>
) {
    const { width, height, words } = data.svg;

    return (
        <svg width={width} height={height}>
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {words.flatMap((word, i) => {
                    ctx.font = `${word.size}px ${word.font}`;

                    const metrics = ctx.measureText(word.text!);
                    const width = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft;
                    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

                    return [
                        <text
                            key={`text-${word.text}`}
                            textAnchor="middle"
                            transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                            style={{
                                fontSize: word.size,
                                fontFamily: word.font,
                                fill: colors[i % colors.length],
                            }}
                        >
                            {word.text}
                        </text>,
                        <rect
                            key={`rect-${word.text}`}
                            x={word.x! - width / 2}
                            y={word.y! - height / 2 - (metrics as any).hangingBaseline / 2}
                            width={width}
                            height={height * 1.1}
                            fill="transparent"
                            onMouseOver={() => set_tooltip(`${data.language} used ${word.text} ${word.value} times`)}
                            onMouseOut={() => set_tooltip(undefined)}
                            onClick={() =>
                                set_selection(
                                    selection === word.text
                                        ? undefined
                                        : {
                                              language: data.language,
                                              selection: word.text!,
                                          }
                                )
                            }
                            onDoubleClick={() => {
                                navigator.clipboard.writeText(word.text!);

                                toast("copied", {
                                    position: "bottom-right",
                                    hideProgressBar: true,
                                    autoClose: 2500,
                                });
                            }}
                        />,
                    ];
                })}
            </g>
        </svg>
    );
}

export function WordCloudTab({ set_selection, set_tooltip, set_language }: WordCloudTabProps) {
    const language = useContext(LanguageContext);
    const selection = useContext(SelectionContext);
    const data = useContext(DataContext);

    return (
        <section className="flex-1">
            <div className="h-full w-full flex flex-col">
                <TransformWrapper
                    alignmentAnimation={{ disabled: true }}
                    velocityAnimation={{ disabled: true }}
                    centerOnInit={true}
                    limitToBounds={false}
                    disablePadding={true}
                    centerZoomedOut={true}
                    minScale={0.5}
                    maxScale={10}
                >
                    {({ resetTransform, centerView, zoomIn, zoomOut }) => (
                        <>
                            {language in data ? (
                                <TransformComponent wrapperClass="flex-1 transform-wrapper-override">
                                    <div className="english grid place-items-center">
                                        {create_svg(data[language], selection, set_selection, set_tooltip)}
                                    </div>
                                </TransformComponent>
                            ) : (
                                <div className="h-full grid place-content-center">
                                    <p>unknown language</p>
                                </div>
                            )}
                            <footer className="text-sm flex flex-row items-center justify-between px-4 py-2 border-t-2 border-neutral-100">
                                <p>
                                    language:{" "}
                                    <select
                                        className="border rounded-sm"
                                        onChange={(e) => set_language(e.target.value)}
                                        value={language}
                                    >
                                        {Object.keys(data).map((lang) => (
                                            <option key={lang} value={lang}>
                                                {lang}
                                            </option>
                                        ))}
                                    </select>
                                </p>
                                <div className="flex flex-row gap-4 items-center">
                                    <button
                                        className="w-16 cursor-pointer border px-2 py-1 rounded-sm"
                                        onClick={() => zoomOut()}
                                    >
                                        -
                                    </button>
                                    <button
                                        className="w-16 cursor-pointer border px-2 py-1 rounded-sm"
                                        onClick={() => zoomIn()}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="w-16 cursor-pointer border px-2 py-1 rounded-sm"
                                        onClick={() => {
                                            resetTransform(0);
                                            centerView(undefined, 0);
                                        }}
                                    >
                                        reset
                                    </button>
                                </div>
                            </footer>
                        </>
                    )}
                </TransformWrapper>
            </div>
        </section>
    );
}
