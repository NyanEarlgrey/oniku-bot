import { Tracing } from '@aws-cdk/aws-lambda'
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as eventsTargets from '@aws-cdk/aws-events-targets'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
require('dotenv').config()

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const getTweetLambda = new lambda.NodejsFunction(this, 'oniku', {
      environment: {
        ACCESS_TOKEN: process.env.ACCESS_TOKEN as string,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        API_KEY: process.env.API_KEY as string,
        API_KEY_SECRET: process.env.API_KEY_SECRET as string
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
