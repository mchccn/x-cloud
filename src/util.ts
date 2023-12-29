import * as OpenCC from "opencc-js";
import config from "../config.json" assert { type: "json" };

export type DataTweet = {
    tweet_id: string;
    user_id: string;
    created_at: number;
    full_text: string;
};

export type Data = {
    english_tweets: DataTweet[];
    chinese_tweets: DataTweet[];
    english_freq: Record<string, number>;
    chinese_freq: Record<string, number>;
};

export type State = { last_updated: number; following: string[]; already_fetched: string[] };

// https://ayaka.shn.hk/hanregex/
export const HAN_REGEX = /[\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?/gmu;

export const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

// https://stackoverflow.com/a/44774554/18244921
export function RFC1738(string: string) {
    return encodeURIComponent(string)
        .replace(/!/g, "%21")
        .replace(/'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/\*/g, "%2A");
}

// https://github.com/sindresorhus/escape-string-regexp
export function escape_regex(string: string) {
    return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

export function freq_table(array: string[]) {
    const table: Record<string, number> = {};

    for (const entry of array) {
        if (!(entry in table)) table[entry] = 0;

        table[entry]++;
    }

    return table;
}

// https://github.com/nk2028/opencc-js
export const traditional_to_simplfiied = OpenCC.Converter({ from: "hk", to: "cn" });

export const replaces_regex = new RegExp(Object.keys(config.replaces).map(escape_regex).join("|"), "g");
export const aliases_regex = new RegExp("\\b(" + Object.keys(config.aliases).map(escape_regex).join("|") + ")\\b", "g");

export const segmenter = new Intl.Segmenter(["en-US", "zh"], {
    granularity: "word",
    localeMatcher: "lookup",
});

export function analyse(raw: string) {
    // currently not removing links, mentions, or "RT" if it was a retweet
    const normalized = traditional_to_simplfiied(
        raw
            .toLowerCase()
            .replace(/https?:\/\/t.co\/[a-zA-Z0-9\.-]*/g, "") // remove all t.co urls
            .replace(replaces_regex, (match) => config.replaces[match as keyof typeof config.replaces])
            .replace(aliases_regex, (match) => config.aliases[match as keyof typeof config.aliases])
    );

    const tags = ["@", "#", "$"];

    const segments = [...segmenter.segment(normalized)];

    const words = [];

    for (let i = 0; i < segments.length; i++) {
        // twitter handle, hashtag, cashtag
        if (tags.includes(segments[i].segment) && segments[i + 1]?.isWordLike) {
            words.push(segments[i].segment + segments[i + 1].segment);

            i++;

            continue;
        }

        // handle compound words joined with hyphens
        if (segments[i].isWordLike && segments[i + 1]?.segment === "-") {
            let group = [segments[i].segment];

            while (segments[i + 1]?.segment === "-" && segments[i + 2]?.isWordLike) {
                group.push(segments[i + 2].segment);

                i += 2;
            }

            words.push(group.join("-"));

            continue;
        }

        // regular word
        if (
            segments[i].isWordLike &&
            Number.isNaN(Number(segments[i].segment)) &&
            !config.ignore_list.includes(segments[i].segment)
        ) {
            words.push(segments[i].segment);

            continue;
        }
    }

    const is_chinese =
        words.filter((x) => HAN_REGEX.test(x)).length > Math.floor(words.length * config.hanzi_percentage);

    return { is_chinese, words: [...new Set(words)] };
}
