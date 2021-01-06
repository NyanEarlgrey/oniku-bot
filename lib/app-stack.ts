import { Tracing } from '@aws-cdk/aws-lambda'
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as eventsTargets from '@aws-cdk/aws-events-targets'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import * as secrets from '@aws-cdk/aws-secretsmanager'
require('dotenv').config()

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const credentials = new secrets.Secret(this, 'TwitterCredentials', { description: 'twitter credentials for oniku-bot.', generateSecretString: undefined })

    const getTweetLambda = new lambda.NodejsFunction(this, 'oniku', {
      environment: {
        ACCESS_TOKEN: process.env.ACCESS_TOKEN ?? credentials.secretValueFromJson('ACCESS_TOKEN').toString(),
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? credentials.secretValueFromJson('ACCESS_TOKEN_SECRET').toString(),
        API_KEY: process.env.API_KEY ?? credentials.secretValueFromJson('API_KEY').toString(),
        API_KEY_SECRET: process.env.API_KEY_SECRET ?? credentials.secretValueFromJson('API_KEY_SECRET').toString()
      },
      timeout: cdk.Duration.seconds(10),
      tracing: Tracing.ACTIVE,
      reservedConcurrentExecutions: 1
    })

    new events.Rule(this, 'ScheduledEvent', {
      schedule: events.Schedule.cron({
        minute: '*',
        hour: '*',
        day: '*',
        month: '*',
        year: '*',
      }),
      targets: [
        new eventsTargets.LambdaFunction(getTweetLambda),
      ]
    })
  }
}
