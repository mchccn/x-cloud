import { createCanvas } from "canvas";
import progress from "cli-progress";
import cloud from "d3-cloud";
import { writeFile } from "fs/promises";
import data from "../data.json" assert { type: "json" };
import { DataTweet, analyse } from "./util.js";

async function render(name: string, table: Record<string, number>, width: number, height: number) {
    const bar = new progress.SingleBar({ format: `${name} svg [{bar}] {value}/{total} {percentage}%` });

    bar.start(Object.keys(table).length, 0);

    function computeFontSize(d: cloud.Word) {
        const x = d.size!;

        if (x <= 25) return 0.06 * (x + 11) ** 2 - 5.26;

        return 10 * Math.sqrt(x - 20) + 50.13932022;
    }

    const out: cloud.Word[] = [];

    const layout = await new Promise<cloud.Word[]>((resolve) =>
        cloud()
            .size([width, height])
            .canvas(() => createCanvas(width, height) as any)
            .words(
                Object.entries(table)
                    .sort(([, a], [, b]) => b - a)
                    .map(([text, size]) => ({ text, size }))
            )
            .padding((d) => 2 + Math.log2(d.size ?? 1))
            .rotate(0)
            .font("Impact")
            .fontSize((d) => 12 * Math.sqrt(d.size!) + 1.25)
            .on("word", (word) => (out.push(word), bar.increment()))
            .on("end", (words) => resolve(words))
            .start()
    );

    bar.stop();

    const json = {
        language: name,
        svg: {
            width,
            height,
            words: layout.map((w) => ({ ...w, value: table[w.text!] })),
        },
    };

    await writeFile(`app/public/${name}.json`, JSON.stringify(json), "utf8");

    return out;
}

async function apigen(name: string, table: cloud.Word[], tweets: DataTweet[]) {
    const bar = new progress.SingleBar({ format: `${name} api [{bar}] {value}/{total} {percentage}%` });

    const words = table.map((word) => word.text!);

    bar.start(words.length, 0);

    for (const word of words) {
        const ids = tweets.filter((t) => analyse(t.full_text).words.includes(word)).map((t) => t.tweet_id);

        await writeFile(
            `app/public/api/${name}/${word
                .split("")
                .map((c) => c.codePointAt(0))
                .join("-")}.json`,
            JSON.stringify(ids),
            "utf8"
        );

        bar.increment();
    }

    bar.stop();
}

const english_words = await render("english", data.english_freq, 900, 900);
const chinese_words = await render("chinese", data.chinese_freq, 900, 900);

await apigen("english", english_words, data.english_tweets);
await apigen("chinese", chinese_words, data.chinese_tweets);
