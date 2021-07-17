import { GeneralApi, TweetsApi, UsersApi, User } from './lib/client'
import { AddOrDeleteRulesRequest, DeleteRulesRequestDelete } from './lib/client/api'
import { Configuration } from './lib/client/configuration'
import Axios, { AxiosError } from 'axios'
import dotenv from 'dotenv'
dotenv.config()

export const axios = Axios.create()
axios.interceptors.response.use(
    async (response) => {
        return response
    },
    async (error: AxiosError) => {
        if (error.response?.status === 429) {
            console.error((error.response.headers['x-rate-limit-reset'] * 1000 - Date.now()) / 1000, error.response.headers)
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
const client = {
    general: new GeneralApi(configuration, undefined, axios),
    users: new UsersApi(configuration, undefined, axios),
    tweets: new TweetsApi(configuration, undefined, axios)
}

export default client

/**
 * ユーザー名からフォロー/フォロワー関係を取得する
 * @example (await Friendships.from('NyanEarlgrey')).mutualFollowing
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
    get mutualFollowing() {
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

/** フォローしているユーザーをタイムラインのルールに加える */
export const createTimelineRulesByUsername = async (username: string) => {
    await deleteAllRules()
    await client.tweets.addOrDeleteRules({
        add: (await Friendships.from(username)).mutualFollowing
            ?.map(user => `from:${user.username}`)
            .reduce((prev, current) =>
                `${prev.split('\n').slice(-1)[0]} OR ${current}`.length > 512
                    ? `${prev}\n${current}`
                    : `${prev} OR ${current}`)
            .split('\n')
            .map((rule, tag) => ({
                value: rule,
                tag: tag.toString()
            }))
    })
}
