import axios, { AxiosRequestConfig } from 'axios'
import dotenv from 'dotenv'
import { IncomingMessage } from 'http'

dotenv.config()

interface Rule {
    id: string
    value: string
    tag: string
}
interface User {
    id: string;
    name: string;
    username: string;
}

const config: AxiosRequestConfig = {
    headers: {
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`
    }
}

const deleteAllRules = async () => {
    const ids = (await axios.get('https://api.twitter.com/2/tweets/search/stream/rules', config))
        .data?.data?.map((rule: Rule) => rule.id)
    ids && await axios.post('https://api.twitter.com/2/tweets/search/stream/rules', { delete: { ids } }, config)
}

const createRules = async () => {
    let rules: Array<Array<string>> = []

    const followers = (await axios.get('https://api.twitter.com/2/users/1042812468748156928/followers?max_results=1000', config))
        .data.data.map((user: User) => `from:${user.username}`)
    // https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction
    followers.reduce((accumulator: string, currentValue: string) => {
        const index = Math.floor((accumulator.length + ` OR ${currentValue} `.length) / 512)
        rules[index] ?? rules.push([])
        rules[index].push(currentValue)
        return `${accumulator} OR ${currentValue} `
    })

    Promise.all(rules.map(async (rule: string[], tag: number) => {
        const value = rule.join(' OR ')
        await axios.post('https://api.twitter.com/2/tweets/search/stream/rules', { add: [{ value, tag }] }, config)
    }))
}

const streamConnect = async (): Promise<IncomingMessage> => (await axios.get('https://api.twitter.com/2/tweets/search/stream', { ...config, responseType: 'stream' })).data;

(async () => {
    try {
        (await streamConnect()).on('data', (chunk) => {
            try {
                console.log(JSON.parse(chunk))
            } catch (error) {
                // Keep alive signal <Buffer 0d 0a> received. Do nothing.
            }
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
})()
