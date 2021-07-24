import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ec2 from '@aws-cdk/aws-ec2'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const cluster = new ecs.Cluster(this, 'Cluster', {
      containerInsights: true,
      vpc: new ec2.Vpc(this, 'Vpc', {
        natGateways: 0,
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 18,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          }
        ]
      }),
    })
    const taskDefinition = new ecs.TaskDefinition(this, 'TaskDefinition', {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: '256',
      memoryMiB: '512',
    })
    taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../')),
      containerName: 'twitter-stream',
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'twitter-stream' }),
      environment: {
        AWS_REGION: process.env.AWS_REGION!,
        API_KEY: process.env.API_KEY!,
        API_SECRET_KEY: process.env.API_SECRET_KEY!,
        ACCESS_TOKEN: process.env.ACCESS_TOKEN!,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
        BEARER_TOKEN: process.env.BEARER_TOKEN!,
      },
    })
    new ecs.FargateService(this, 'Service', {
      cluster,
      assignPublicIp: true,
      taskDefinition,
    })
  }
}
