import { ScheduledHandler } from 'aws-lambda'
import Twitter, { ResponseData } from 'twitter'
require('dotenv').config()

const client = new Twitter({
    access_token_key: process.env.ACCESS_TOKEN as string,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET as string,
    consumer_key: process.env.API_KEY as string,
    consumer_secret: process.env.API_KEY_SECRET as string
})

export const handler: ScheduledHandler = async () => {
    try {
        const tweets = (await client.get('statuses/home_timeline', {
            exclude_replies: false,
            include_entities: true,
            trim_user: false
        })).filter((tweet: ResponseData) =>
            Date.parse(tweet.created_at) > Date.now() - 60 * 1000
            && !tweet.retweeted_status
            && !tweet.quoted_status
            && tweet.entities.media
            && tweet.text.match(/肉|おにく/)
        )

        console.log(tweets)

        await Promise.all(tweets.map(async (tweet: any) => {
            await client.post('statuses/update', {
                in_reply_to_status_id: tweet.id_str,
                status: `@${tweet.user.screen_name} にくうううううううううううう🍖`,
                trim_user: true
            })
        }))
    } catch (error) {
        console.error(error)
    }
}
