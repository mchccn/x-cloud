import { readFile, writeFile } from "fs/promises";
import "../../data.js";
import config from "../config.json" assert { type: "json" };

// https://stackoverflow.com/a/44774554/18244921
function RFC1738(string: string) {
    return encodeURIComponent(string)
        .replace(/!/g, "%21")
        .replace(/'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/\*/g, "%2A");
}

// https://github.com/sindresorhus/escape-string-regexp
function escapeR(string: string) {
    return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

const input = await readFile("input.txt", "utf8");
const headers = Object.fromEntries(
    input
        .split("\n")
        .slice(1, -1)
        .map((line) => line.slice(6, -3).split(": "))
);

const target = config.target_user;

const following: number[] = await fetch(`https://api.twitter.com/1.1/friends/ids.json?screen_name=${target}`, {
    headers,
})
    .then((res) => res.json())
    .then((json) => json.ids);

const tweets = [];

outer: for (const id of following) {
    for (let i = 0, cursor = undefined; i < config.timeline_pages_count; i++) {
        try {
            const e: any = await fetch(
                `https://twitter.com/i/api/graphql/V1ze5q3ijDS1VeLwLY0m7g/UserTweets?variables=${RFC1738(
                    JSON.stringify({
                        userId: id.toString(),
                        count: 20,
                        cursor,
                        includePromotedContent: false,
                        withQuickPromoteEligibilityTweetFields: false,
                        withVoice: false,
                        withV2Timeline: true,
                    })
                )}&features=${RFC1738(
                    JSON.stringify({
                        responsive_web_graphql_exclude_directive_enabled: false,
                        verified_phone_label_enabled: false,
                        creator_subscriptions_tweet_preview_api_enabled: false,
                        responsive_web_graphql_timeline_navigation_enabled: false,
                        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                        c9s_tweet_anatomy_moderator_badge_enabled: false,
                        tweetypie_unmention_optimization_enabled: false,
                        responsive_web_edit_tweet_api_enabled: false,
                        graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
                        view_counts_everywhere_api_enabled: false,
                        longform_notetweets_consumption_enabled: false,
                        responsive_web_twitter_article_tweet_consumption_enabled: false,
                        tweet_awards_web_tipping_enabled: false,
                        freedom_of_speech_not_reach_fetch_enabled: false,
                        standardized_nudges_misinfo: false,
                        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
                        rweb_video_timestamps_enabled: false,
                        longform_notetweets_rich_text_read_enabled: false,
                        longform_notetweets_inline_media_enabled: false,
                        responsive_web_media_download_video_enabled: false,
                        responsive_web_enhance_cards_enabled: false,
                    })
                )}`,
                {
                    headers,
                }
            ).then((res) => res.json());

            const entries = e.data.user.result.timeline_v2.timeline.instructions.find(
                (x: any) => x.type === "TimelineAddEntries"
            ).entries;

            tweets.push(...entries.filter((x: any) => x.entryId.startsWith("tweet")));

            cursor = entries.at(-1).content.value;
        } catch (e) {
            if ((e as Error).message.includes("Rate limit exceeded")) {
                console.error("Rate limit exceeded");

                break outer;
            }

            break;
        }
    }
}

const words = [];

const replaceR = new RegExp(Object.keys(config.replaces).map(escapeR).join("|"), "g");
const aliasesR = new RegExp("\\b(" + Object.keys(config.aliases).map(escapeR).join("|") + ")\\b", "g");

const segmenter = new Intl.Segmenter(["en-US", "zh"], {
    granularity: "word",
    localeMatcher: "lookup",
});

for (const tweet of tweets) {
    const raw: string = tweet.content.itemContent.tweet_results.result.legacy.full_text;

    const normalized = raw
        .toLowerCase()
        .replace(replaceR, (match) => {
            return config.replaces[match as keyof typeof config.replaces];
        })
        .replace(aliasesR, (match) => {
            return config.aliases[match as keyof typeof config.aliases];
        });

    words.push(
        ...[...segmenter.segment(normalized)]
            .filter((x) => x.isWordLike && Number.isNaN(Number(x.segment)))
            .map((x) => x.segment)
            .filter((x) => !config.ignore_list.includes(x))
    );
}

const freqt = words.reduce((map, word) => map.set(word, (map.get(word) ?? 0) + 1), new Map());

//@ts-ignore
globalThis.WORD_DATA = globalThis.WORD_DATA ?? {};

//@ts-ignore
globalThis.WORD_DATA[target] = Object.fromEntries([...freqt.entries()]);

//@ts-ignore
await writeFile("data.js", `globalThis.WORD_DATA = ${JSON.stringify(globalThis.WORD_DATA)};`, "utf8");
