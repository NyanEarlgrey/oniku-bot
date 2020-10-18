import * as cdk from '@aws-cdk/core';
import * as eventsTargets from '@aws-cdk/aws-events-targets';
import * as events from "@aws-cdk/aws-events";
import * as lambda from '@aws-cdk/aws-lambda';
// import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import * as apigw from '@aws-cdk/aws-apigateway'
import * as dotenv from "dotenv";
dotenv.config();

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getTweetLambda = new lambda.Function(this, "GetTweetFn", {
      environment: {
        ACCESS_TOKEN: process.env.ACCESS_TOKEN as string,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        API_KEY: process.env.API_KEY as string,
        API_KEY_SECRET: process.env.API_KEY_SECRET as string
      },
      code: new lambda.AssetCode('lib'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
    });

    new events.Rule(this, "ScheduledEvent", {
      schedule: events.Schedule.cron({
        minute: "*",
        hour: "*",
        day: "*",
        month: "*",
        year: "*",
      }),
      targets: [
        new eventsTargets.LambdaFunction(getTweetLambda),
      ],
    })

    if (process.env.NODE_ENV !== 'production') {
      const restApi = new apigw.RestApi(this, 'API')
      restApi.root.addMethod('GET', new apigw.LambdaIntegration(getTweetLambda))
    }
  }
}
