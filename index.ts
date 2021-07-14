import { TweetsApi, SingleTweetLookupResponse } from './lib/client'
import dotenv from 'dotenv'
dotenv.config()

const client = new TweetsApi({
    isJsonMime: () => true,
    accessToken: process.env.BEARER_TOKEN,
});

(() => client.sampleStream(
    new Set(['attachments.poll_ids', 'attachments.media_keys', 'author_id', 'entities.mentions.username', 'geo.place_id', 'in_reply_to_user_id', 'referenced_tweets.id', 'referenced_tweets.id.author_id']),
    new Set(['attachments', 'author_id', 'context_annotations', 'conversation_id', 'created_at', 'entities', 'geo', 'id', 'in_reply_to_user_id', 'lang', 'public_metrics', 'possibly_sensitive', 'referenced_tweets', 'source', 'text', 'withheld']),
    new Set(['created_at', 'description', 'entities', 'id', 'location', 'name', 'pinned_tweet_id', 'profile_image_url', 'protected', 'public_metrics', 'url', 'username', 'verified', 'withheld']),
    new Set(['duration_ms', 'height', 'media_key', 'preview_image_url', 'type', 'url', 'width', 'public_metrics']),
    new Set(['contained_within', 'country', 'country_code', 'full_name', 'geo', 'id', 'name', 'place_type']),
    undefined,
    undefined,
    { responseType: 'stream' }
)
    .then(({ data }) => {
        (data as NodeJS.ReadableStream).on('data', async (chunk: Buffer) => {
            try {
                // Keep alive signal < Buffer 0d 0a > received.Do nothing.
                if (chunk.length > 2) {
                    const tweet = JSON.parse(chunk.toString('utf8')) as SingleTweetLookupResponse
                    if (tweet?.data?.lang === 'ja' && tweet.data.context_annotations) {
                        console.log(JSON.stringify(tweet, null, 2))
                    }
                }
            } catch (e) {
                console.error(e, chunk.toString('utf-8'))
            } finally {
                console.error(chunk.length, chunk)
            }
        })
    })
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
)()
