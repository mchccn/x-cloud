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
            .words(
                Object.entries(table)
                    .sort(([, a], [, b]) => b - a)
                    .map(([text, size]) => ({ text, size }))
            )
            .padding((d) => 2 + Math.log2(d.size ?? 1))
            .rotate(0)
            .font("Impact")
            .fontSize((d) => 10 * Math.sqrt(d.size!) + 1)
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
        const ids = [
            ...new Set(tweets.filter((t) => analyse(t.full_text).words.includes(word)).map((t) => t.tweet_id)),
        ];

        const json = await Promise.all(
            ids.map((id) => {
                const url = new URL(`https://cdn.syndication.twimg.com/tweet-result`);

                url.searchParams.set("id", id);
                url.searchParams.set("lang", "en");
                url.searchParams.set(
                    "features",
                    [
                        "tfw_timeline_list:",
                        "tfw_follower_count_sunset:true",
                        "tfw_tweet_edit_backend:on",
                        "tfw_refsrc_session:on",
                        "tfw_fosnr_soft_interventions_enabled:on",
                        "tfw_show_birdwatch_pivots_enabled:on",
                        "tfw_show_business_verified_badge:on",
                        "tfw_duplicate_scribes_to_settings:on",
                        "tfw_use_profile_image_shape_enabled:on",
                        "tfw_show_blue_verified_badge:on",
                        "tfw_legacy_timeline_sunset:true",
                        "tfw_show_gov_verified_badge:on",
                        "tfw_show_business_affiliate_badge:on",
                        "tfw_tweet_edit_frontend:on",
                    ].join(";")
                );
                url.searchParams.set("token", ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, ""));

                return fetch(url).then((res) =>
                    res.headers.get("content-type")?.includes("application/json") ? res.json() : undefined
                );
            })
        );

        await writeFile(
            `app/public/api/${name}/${word
                .split("")
                .map((c) => c.codePointAt(0))
                .join("-")}.json`,
            JSON.stringify(json.filter((x) => x !== undefined && x.__typename === "Tweet")),
            "utf8"
        );

        bar.increment();
    }

    bar.stop();
}

const english_words = await render("english", data.english_freq, 1800, 1800);
const chinese_words = await render("chinese", data.chinese_freq, 1800, 1800);

await apigen("english", english_words, data.english_tweets);
await apigen("chinese", chinese_words, data.chinese_tweets);
