import Twitter from 'twitter'
import * as dotenv from 'dotenv'
dotenv.config()

const client = new Twitter({
    access_token_key: process.env.ACCESS_TOKEN as string,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET as string,
    consumer_key: process.env.API_KEY as string,
    consumer_secret: process.env.API_KEY_SECRET as string
})

export const handler = async () => {
    const tweets = await client.get('statuses/home_timeline', {
        count: 10,
        exclude_replies: true,
        include_entities: true,
        trim_user: false
    }).then(data => {
        return data.filter((tweet: any) =>
            Date.parse(tweet.created_at) > Date.now() - 600 * 1000
            && !tweet.retweeted_status
            && !tweet.quoted_status
            && tweet.entities.media
            && tweet.text.match(/肉|おにく/)
        )
    }).catch(_ => [])

    const posts = await Promise.all(tweets.map(async (tweet: any) => {
        return await client.post('statuses/update', {
            in_reply_to_status_id: tweet.id,
            status: 'にくうううううううううううう🍖',
            trim_user: true
        })
            .then(data => data)
            .catch(_ => [])
    }))

    return posts.length
        ? { statusCode: 200, body: JSON.stringify(posts) }
        : { statusCode: 204 }
}
