import Axios, { AxiosError } from 'axios'
import { GeneralApi, TweetsApi, UsersApi, User } from './client/'
import { AddOrDeleteRulesRequest, DeleteRulesRequestDelete } from './client/api'
import { Configuration } from './client/configuration'
import { TwitterClient } from 'twitter-api-client'
import dotenv from 'dotenv'
import Logger from 'node-json-logger'
dotenv.config()

export const logger = new Logger()

/**
 * **tweetFields** : `expansions.referenced_tweets.ids`
 * @param 'id', 'created_at', 'text', 'author_id', 'in_reply_to_user_id', 'referenced_tweets', 'attachments', 'withheld', 'geo', 'entities', 'public_metrics', 'possibly_sensitive', 'source', 'lang', 'context_annotations', 'non_public_metrics', 'promoted_metrics', 'organic_metrics', 'conversation_id', 'reply_settings'
 *
 * **userFields** : `expansions.author_id | expansions.entities.mentions.username | expansions.in_reply_to_user_id | expansions.referenced_tweets.id.author_id`
 * @param 'id', 'created_at', 'name', 'username', 'protected', 'verified', 'withheld', 'profile_image_url', 'location', 'url', 'description', 'entities', 'pinned_tweet_id', 'public_metrics'
 *
 * **mediaFields** : `expansions.attachments.media_keys`
 * @param 'media_key', 'duration_ms', 'height', 'preview_image_url', 'type', 'url', 'width', 'public_metrics', 'non_public_metrics', 'organic_metrics', 'promoted_metrics'
 *
 * **placeFields** : `expansions.geo.place_id`
 * @param 'id', 'name', 'country_code', 'place_type', 'full_name', 'country', 'contained_within', 'geo'
 *
 * **pollFields** : `expansions.attachments.poll_ids`
 * @param 'id', 'options', 'voting_status', 'end_datetime', 'duration_minutes'
 *
 * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
 */
export type Fields = [
    /** tweetFields */
    undefined | Set<'id' | 'created_at' | 'text' | 'author_id' | 'in_reply_to_user_id' | 'referenced_tweets' | 'attachments' | 'withheld' | 'geo' | 'entities' | 'public_metrics' | 'possibly_sensitive' | 'source' | 'lang' | 'context_annotations' | 'non_public_metrics' | 'promoted_metrics' | 'organic_metrics' | 'conversation_id' | 'reply_settings'>,
    /** userFields */
    undefined | Set<'id' | 'created_at' | 'name' | 'username' | 'protected' | 'verified' | 'withheld' | 'profile_image_url' | 'location' | 'url' | 'description' | 'entities' | 'pinned_tweet_id' | 'public_metrics'>,
    /** mediaFields */
    undefined | Set<'media_key' | 'duration_ms' | 'height' | 'preview_image_url' | 'type' | 'url' | 'width' | 'public_metrics' | 'non_public_metrics' | 'organic_metrics' | 'promoted_metrics'>,
    /** placeFields */
    undefined | Set<'id' | 'name' | 'country_code' | 'place_type' | 'full_name' | 'country' | 'contained_within' | 'geo'>,
    /** pollFields */
    undefined | Set<'id' | 'options' | 'voting_status' | 'end_datetime' | 'duration_minutes'>
]

export const axios = Axios.create()
axios.interceptors.response.use(
    async (response) => {
        // response.config.responseType !== 'stream' && logger.debug(response.data)
        return response
    },
    async (error: AxiosError) => {
        if (error.response?.status === 429) {
            await new Promise(r => setTimeout(r, error.response?.headers['x-rate-limit-reset'] * 1000 - Date.now()))
            return axios.request(error.config)
        } else {
            return error
        }
    })

const configuration = {
    isJsonMime: new Configuration().isJsonMime,
    accessToken: process.env.BEARER_TOKEN,
}
/** @link https://developer.twitter.com/en/docs/authentication/oauth-1-0a/obtaining-user-access-tokens */
const client = {
    general: new GeneralApi(configuration, undefined, axios),
    users: new UsersApi(configuration, undefined, axios),
    tweets: new TweetsApi(configuration, undefined, axios),
    v1: new TwitterClient({
        apiKey: process.env.API_KEY!,
        apiSecret: process.env.API_SECRET_KEY!,
        accessToken: process.env.ACCESS_TOKEN!,
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    })
}

export default client

/**
 * ユーザー名からフォロー/フォロワー関係を取得する
 * @example (await Friendships.from('NyanEarlgrey')).mutualfollowing
 */
export class Friendships {
    /** フォロー/フォロワーを取得するユーザー */
    from: User
    private _following: Set<string>
    private _followers: Set<string>
    constructor(user: User, following: User[], followers: User[]) {
        this.from = user
        this._following = new Set(following.map(JSON.stringify as () => string))
        this._followers = new Set(followers.map(JSON.stringify as () => string))
    }
    static async from(username: string): Promise<Friendships> {
        const user = (await client.users.findUserByUsername(username)).data.data!
        return new Friendships(
            user,
            (await client.users.usersIdFollowing(user.id, 1000)).data.data ?? [],
            (await client.users.usersIdFollowers(user.id, 1000)).data.data ?? []
        )
    }
    private parser(set: Set<string | unknown>) {
        return Array.from(set).map(JSON.parse as () => User)
    }
    /** フォローしているユーザー */
    get following() {
        return this.parser(this._following)
    }
    /** フォローされているユーザー */
    get followers() {
        return this.parser(this._followers)
    }
    /** 相互にフォローしているユーザー */
    get mutualfollowing() {
        let intersection = new Set()
        for (let user of this._following) {
            if (this._followers.has(user)) {
                intersection.add(user)
            }
        }
        return this.parser(intersection)
    }
    /** フォロー返ししていないユーザー */
    get unfollowing() {
        let difference = new Set(this._followers)
        for (let user of this._following) {
            difference.delete(user)
        }
        return this.parser(difference)
    }
    /** フォロー返しされていないユーザー */
    get unfollowers() {
        let difference = new Set(this._following)
        for (let user of this._followers) {
            difference.delete(user)
        }
        return this.parser(difference)
    }
}

/** 全てのルールを削除する */
export const deleteAllRules = async () => {
    const rules = (await client.tweets.getRules()).data
    await (client.tweets.addOrDeleteRules as (addOrDeleteRulesRequest: AddOrDeleteRulesRequest | { delete: DeleteRulesRequestDelete }) => void)({
        delete: { ids: rules.data?.map(r => r.id!) }
    })
}

/**
 * フォローしているユーザーをタイムラインのルールに加える
 * @example await createTimelineRulesByUsername('NyanEarlgrey', '-is:retweet -is:reply has:images')
 * @link https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query
 */
export const createTimelineRulesByUsername = async (username = 'NyanEarlgrey', operators = '-is:retweet -is:reply has:images') => {
    await deleteAllRules()
    await client.tweets.addOrDeleteRules({
        add: (await Friendships.from(username)).mutualfollowing
            ?.map(user => `from:${user.username}`)
            .reduce((prev, current) =>
                `(${prev.split('\n').slice(-1)[0]} OR ${current}) ${operators}`.length > 512
                    ? `${prev}\n${current}`
                    : `${prev} OR ${current}`)
            .split('\n')
            .map((rule, tag) => ({
                value: `(${rule}) ${operators}`,
                tag: tag.toString()
            }))
    })
}
