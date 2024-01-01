import { readFile, writeFile } from "fs/promises";
import { inspect } from "util";
import config from "../config.json" assert { type: "json" };
import _data from "../data.json" assert { type: "json" };
import _state from "../state.json" assert { type: "json" };
import { Data, ONE_WEEK, RFC1738, State, analyse, freq_table } from "./util.js";

const data = _data as Data;
const state = _state as State;

const new_state: State = Object.assign({}, state);

const input = await readFile("input.txt", "utf8");
const headers = Object.fromEntries(
    input
        .split("\n")
        .slice(1, -1)
        .map((line) => line.slice(6, -3).split(": "))
);

const target = config.target_user;

const following: string[] =
    !state.following.length || Date.now() - state.last_updated > ONE_WEEK
        ? await fetch(`https://api.twitter.com/1.1/friends/ids.json?screen_name=${target}&stringify_ids=true`, {
              headers,
          })
              .then((res) => res.json())
              .then((json) => json.ids)
        : state.following;

console.log(`following ${following.length} people`);

new_state.following = following;

const needs_fetch = following.every((x) => state.already_fetched.includes(x))
    ? following
    : following.filter((x) => !state.already_fetched.includes(x));

if (needs_fetch === following) new_state.already_fetched = [];

console.log(
    `already fetched ${following.length - needs_fetch.length} out of ${following.length} (${(
        ((following.length - needs_fetch.length) / following.length) *
        100
    ).toFixed(1)}%)`
);

const tweets = [];

const fetched_this_round = new Set<string>();

outer: for (const id of needs_fetch) {
    for (let i = 0, cursor = undefined; i < config.timeline_pages_count; i++) {
        console.log(`fetching ${id} (page ${i + 1})`);

        try {
            const e: any = await fetch(
                `https://twitter.com/i/api/graphql/V1ze5q3ijDS1VeLwLY0m7g/UserTweets?variables=${RFC1738(
                    JSON.stringify({
                        userId: id,
                        count: 20,
                        cursor,
                        includePromotedContent: false,
                        withQuickPromoteEligibilityTweetFields: false,
                        withVoice: false,
                        withV2Timeline: true,
                    })
                )}&features=${RFC1738(
                    JSON.stringify({
                        responsive_web_graphql_exclude_directive_enabled: true,
                        verified_phone_label_enabled: false,
                        creator_subscriptions_tweet_preview_api_enabled: true,
                        responsive_web_graphql_timeline_navigation_enabled: true,
                        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
                        c9s_tweet_anatomy_moderator_badge_enabled: true,
                        tweetypie_unmention_optimization_enabled: true,
                        responsive_web_edit_tweet_api_enabled: true,
                        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                        view_counts_everywhere_api_enabled: true,
                        longform_notetweets_consumption_enabled: true,
                        responsive_web_twitter_article_tweet_consumption_enabled: false,
                        tweet_awards_web_tipping_enabled: false,
                        freedom_of_speech_not_reach_fetch_enabled: true,
                        standardized_nudges_misinfo: true,
                        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
                        rweb_video_timestamps_enabled: true,
                        longform_notetweets_rich_text_read_enabled: true,
                        longform_notetweets_inline_media_enabled: true,
                        responsive_web_media_download_video_enabled: false,
                        responsive_web_enhance_cards_enabled: false,
                    })
                )}`,
                {
                    headers,
                }
            ).then((res) => res.json());

            if (e.errors?.length) throw new Error(e.errors[0].message);

            const entries = e.data.user.result.timeline_v2.timeline.instructions.find(
                (x: any) => x.type === "TimelineAddEntries"
            ).entries;

            tweets.push(...entries.filter((x: any) => x.entryId.startsWith("tweet")));

            cursor = entries.at(-1).content.value;

            fetched_this_round.add(id);
        } catch (e) {
            if ((e as Error).message.includes("Rate limit exceeded")) {
                console.error("Rate limit exceeded");

                break outer;
            }

            if ((e as Error).message.includes("Could not authenticate you")) {
                console.error("Bad auth");

                break outer;
            }

            fetched_this_round.add(id); // malformed response, count as fetched

            break;
        }
    }
}

new_state.already_fetched.push(...[...fetched_this_round]);

const english_tweets = [];
const chinese_tweets = [];
const english_cloud = [];
const chinese_cloud = [];

for (const tweet of tweets) {
    const full_text =
        tweet.content.itemContent.tweet_results.result.legacy?.retweeted_status_result?.result?.note_tweet
            ?.note_tweet_results?.result?.text ??
        tweet.content.itemContent.tweet_results.result.note_tweet?.note_tweet_results?.result?.text ??
        tweet.content.itemContent.tweet_results.result.legacy?.retweeted_status_result?.result?.legacy?.full_text ??
        tweet.content.itemContent.tweet_results.result.legacy?.full_text ??
        tweet.content.itemContent.tweet_results.result.tweet?.legacy?.full_text;

    const id_str =
        tweet.content.itemContent.tweet_results.result.legacy?.retweeted_status_result?.result?.legacy?.id_str ??
        tweet.content.itemContent.tweet_results.result.legacy?.id_str ??
        tweet.content.itemContent.tweet_results.result.tweet?.legacy?.id_str;

    const user_id_str =
        tweet.content.itemContent.tweet_results.result.legacy?.retweeted_status_result?.result?.legacy?.user_id_str ??
        tweet.content.itemContent.tweet_results.result.legacy?.user_id_str ??
        tweet.content.itemContent.tweet_results.result.tweet?.legacy?.user_id_str;

    const created_at =
        tweet.content.itemContent.tweet_results.result.legacy?.retweeted_status_result?.result?.legacy?.created_at ??
        tweet.content.itemContent.tweet_results.result.legacy?.created_at ??
        tweet.content.itemContent.tweet_results.result.tweet?.legacy?.created_at;

    if (!full_text) {
        console.log("no text?", inspect(tweet, undefined, Infinity, true));

        continue;
    }

    if (full_text.includes("…")) {
        console.log("missing text?", inspect(tweet, undefined, Infinity, true));

        continue;
    }

    const to_store = {
        tweet_id: id_str,
        user_id: user_id_str,
        created_at: Math.floor(new Date(created_at).getTime() / 1000),
        full_text: full_text,
    };

    const { is_chinese, words } = analyse(full_text);

    if (is_chinese) {
        chinese_tweets.push(to_store);
        chinese_cloud.push(...words);
    } else {
        english_tweets.push(to_store);
        english_cloud.push(...words);
    }
}

const english_freq = freq_table(english_cloud);
const chinese_freq = freq_table(chinese_cloud);

new_state.last_updated = Date.now();

await writeFile("state.json", JSON.stringify(new_state, null, 4), "utf8");

const new_data = {
    english_tweets: data.english_tweets.concat(english_tweets),
    chinese_tweets: data.chinese_tweets.concat(chinese_tweets),
    english_freq: Object.entries(english_freq).reduce((freq, [key, value]) => {
        if (key in freq) freq[key] += value;
        else freq[key] = value;

        return freq;
    }, data.english_freq),
    chinese_freq: Object.entries(chinese_freq).reduce((freq, [key, value]) => {
        if (key in freq) freq[key] += value;
        else freq[key] = value;

        return freq;
    }, data.chinese_freq),
};

await writeFile("data.json", JSON.stringify(new_data, null, 4), "utf8");

if (new_state.already_fetched.length !== new_state.following.length) {
    process.exit(1);
}

console.log("done fetching");

process.exit(0);
