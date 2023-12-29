import progress from "cli-progress";
import { writeFile } from "fs/promises";
import data from "../data.json" assert { type: "json" };
import { analyse, freq_table } from "./util.js";

const bar = new progress.SingleBar({ format: "working... [{bar}] {value}/{total} {percentage}%" });

const all_tweets = data.english_tweets.concat(data.chinese_tweets);

const english_tweets = [];
const chinese_tweets = [];
const english_cloud = [];
const chinese_cloud = [];

bar.start(all_tweets.length, 0);

for (const tweet of all_tweets) {
    const { is_chinese, words } = analyse(tweet.full_text);

    if (is_chinese) {
        chinese_tweets.push(tweet);
        chinese_cloud.push(...words);
    } else {
        english_tweets.push(tweet);
        english_cloud.push(...words);
    }

    bar.increment();
}

bar.stop();

const english_freq = freq_table(english_cloud);
const chinese_freq = freq_table(chinese_cloud);

const new_data = {
    english_tweets,
    chinese_tweets,
    english_freq,
    chinese_freq,
};

await writeFile("data.json", JSON.stringify(new_data, null, 4), "utf8");
