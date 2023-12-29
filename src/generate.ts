import { createCanvas } from "canvas";
import progress from "cli-progress";
import cloud from "d3-cloud";
import { writeFile } from "fs/promises";
import data from "../data.json" assert { type: "json" };
import { DataTweet, analyse } from "./util.js";

async function render(name: string, table: Record<string, number>, width: number, height: number) {
    const bar = new progress.SingleBar({ format: `${name} svg [{bar}] {value}/{total} {percentage}%` });

    bar.start(Object.keys(table).length, 0);

    const out: cloud.Word[] = [];

    const layout = await new Promise<cloud.Word[]>((resolve) =>
        cloud()
            .size([width, height])
            .canvas(() => createCanvas(width, height) as any)
            .words(Object.entries(table).map(([text, size]) => ({ text, size })))
            .padding((d) => 2 + Math.log2(d.size ?? 1))
            .rotate(0)
            .font("Impact")
            .fontSize((d) => 3 + (d.size ?? 1) * 8)
            .on("word", (word) => (out.push(word), bar.increment()))
            .on("end", (words) => resolve(words))
            .start()
    );

    bar.stop();

    const colors = ["#F12046", "#009DDC", "#F26430", "#6761A8", "#009B72"];

    const svg = `\
<svg data-name="${name}" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g transform="translate(${width / 2}, ${height / 2})">
${layout
    .map((word, i) => {
        return `\
        <text data-x="${word.x}" data-y="${word.y}" data-value="${
            table[word.text!]
        }" text-anchor="middle" transform="translate(${word.x}, ${word.y}) rotate(${word.rotate})" style="font-size: ${
            word.size
        }px; font-family: ${word.font}; fill: ${colors[i % colors.length]}">${word.text}</text>`;
    })
    .join("\n")}
    </g>
</svg>`;

    await writeFile(`app/${name}.svg`, svg, "utf8");

    return out;
}

async function apigen(name: string, table: cloud.Word[], tweets: DataTweet[]) {
    const bar = new progress.SingleBar({ format: `${name} api [{bar}] {value}/{total} {percentage}%` });

    const words = table.map((word) => word.text!);

    bar.start(words.length, 0);

    for (const word of words) {
        const ids = tweets.filter((t) => analyse(t.full_text).words.includes(word)).map((t) => t.tweet_id);

        const embeds = await Promise.all(
            ids.map((id) =>
                fetch(`https://publish.twitter.com/oembed?url=https://twitter.com/username/status/${id}`)
                    .then((res) => res.json())
                    .catch(() => undefined)
            )
        );

        await writeFile(`app/api/${name}/${word}.json`, JSON.stringify(embeds.filter((x) => x !== undefined)), "utf8");

        bar.increment();
    }

    bar.stop();
}

const english_words = await render("english", data.english_freq, 900, 900);
const chinese_words = await render("chinese", data.chinese_freq, 900, 900);

await apigen("english", english_words, data.english_tweets);
await apigen("chinese", chinese_words, data.chinese_tweets);
