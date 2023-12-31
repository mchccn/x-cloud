import cloud from "d3-cloud";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SelectionContext } from "../SelectionContext";

export interface WordCloudTabProps {
    set_selection: Dispatch<SetStateAction<{ language: string; selection: string } | undefined>>;
    set_tooltip: Dispatch<SetStateAction<string | undefined>>;
}

const ctx = document.createElement("canvas").getContext("2d")!;

const colors = ["#F12046", "#009DDC", "#F26430", "#6761A8", "#009B72"];

type ResponseData = {
    language: string;
    svg: {
        width: number;
        height: number;
        words: (cloud.Word & { value: number })[];
    };
};

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

export function WordCloudTab({ set_selection, set_tooltip }: WordCloudTabProps) {
    const [loaded, set_loaded] = useState(false);

    const [english, set_english] = useState<ResponseData>();
    const [chinese, set_chinese] = useState<ResponseData>();

    const selection = useContext(SelectionContext);

    useEffect(() => {
        Promise.all([
            fetch("english.json").then((res) => res.json()),
            fetch("chinese.json").then((res) => res.json()),
        ]).then(([english, chinese]) => {
            set_english(english);
            set_chinese(chinese);

            set_loaded(true);
        });
    }, []);

    return (
        <section className="tab grid overflow-scroll flex-1">
            {loaded ? (
                <>
                    <div className="english h-screen grid place-items-center">
                        {create_svg(english!, selection, set_selection, set_tooltip)}
                    </div>
                    <div className="chinese h-screen grid place-items-center">
                        {create_svg(chinese!, selection, set_selection, set_tooltip)}
                    </div>
                </>
            ) : (
                <div className="h-screen grid place-items-center">
                    <p>loading...</p>
                </div>
            )}
        </section>
    );
}
