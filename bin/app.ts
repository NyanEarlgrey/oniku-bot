#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { AppStack } from '../lib/app-stack'

const app = new cdk.App()
new AppStack(app, 'AppStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-northeast-1'
    }
})
