import client, { createTimelineRulesByUsername, deleteAllRules, Fields, logger } from './client'
import { SingleTweetLookupResponse, Photo } from './lib/client'
import axios from 'axios'
import { Rekognition } from 'aws-sdk'
const rekognition = new Rekognition()

export const getImageLabelsByUrl = async (url: string) => await rekognition.detectLabels({
    Image: { Bytes: (await axios.get(url, { responseType: 'arraybuffer' })).data },
    MinConfidence: 75
}).promise()

interface LabelPhoto extends Photo {
    labels: Rekognition.Label[]
}

export const isNikuTweet = async (tweet: SingleTweetLookupResponse) => {
    const niku = [
        'Bacon',
        'Bbq',
        'Burger',
        'Butcher Shop',
        'Meat Loaf',
        'Meatball',
        'Pork',
        'Ribs',
        'Steak',
    ]
    const photos = (await Promise.all((tweet.includes?.media
        ?.filter(medium => medium.type === 'photo') as Photo[])
        .map<Promise<LabelPhoto>>(async (photo) => {
            const labels = (await getImageLabelsByUrl(photo.url!)).Labels!
            return { ...photo, labels }
        })
    ))
    logger.info({ photos, tweet })
    return photos.some(photo => photo.labels.some(label => niku.includes(label.Name!)))
}

export const fields: Fields = [
    new Set(['attachments', 'author_id', 'context_annotations', 'conversation_id', 'created_at', 'entities', 'geo', 'id', 'in_reply_to_user_id', 'lang', 'public_metrics', 'possibly_sensitive', 'referenced_tweets', 'source', 'text', 'withheld']),
    new Set(['created_at', 'description', 'entities', 'id', 'location', 'name', 'pinned_tweet_id', 'profile_image_url', 'protected', 'public_metrics', 'url', 'username', 'verified', 'withheld']),
    new Set(['duration_ms', 'height', 'media_key', 'preview_image_url', 'type', 'url', 'width', 'public_metrics']),
    new Set(['contained_within', 'country', 'country_code', 'full_name', 'geo', 'id', 'name', 'place_type']),
    new Set(['id', 'options', 'voting_status', 'end_datetime', 'duration_minutes']),
];

(async (args) => {
    switch (args[0]) {
        case 'createRules':
            await createTimelineRulesByUsername(...args.slice(1, 3))
            break
        case 'deleteRules':
            await deleteAllRules()
            break
        case 'getLabels':
            logger.debug(await getImageLabelsByUrl(args[1]))
            break
        case 'isOnikuTweet':
            console.log(
                await isNikuTweet((await client.tweets.findTweetById(
                    args[1],
                    new Set(['author_id', 'referenced_tweets.id', 'in_reply_to_user_id', 'attachments.media_keys', 'entities.mentions.username', 'referenced_tweets.id.author_id']),
                    ...fields,
                )).data)
            )
            break
        default:
            client.tweets.searchStream(
                new Set(['attachments.media_keys', 'referenced_tweets.id', 'entities.mentions.username', 'in_reply_to_user_id']),
                ...fields,
                undefined,
                { responseType: 'stream' }
            )
                .then(({ data }: { data: unknown }) => {
                    (data as NodeJS.ReadableStream).on('data', async (chunk: Buffer) => {
                        try {
                            /** Keep alive signal < Buffer 0d 0a > received. Do nothing. */
                            if (chunk.length > 2) {
                                const tweet: SingleTweetLookupResponse = JSON.parse(chunk.toString('utf8'))
                                if (await isNikuTweet(tweet)) {
                                    await client.v1.tweets.statusesUpdate({
                                        status: 'にくぅうううう🍖',
                                        in_reply_to_status_id: tweet.data?.id,
                                        auto_populate_reply_metadata: true,
                                    })
                                }
                            }
                        } catch (error) {
                            logger.error({ error: error.toString(), chunk_length: chunk.length, chunk: chunk.toString('utf8') })
                            process.exit(1)
                        }
                    })
                })
                .catch(error => {
                    logger.error({ error: error.toString() })
                    process.exit(1)
                })
    }
})(process.argv.slice(2))
