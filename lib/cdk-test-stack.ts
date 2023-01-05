// import * as cdk from 'aws-cdk-lib';
import {
  CfnOutput,
  Construct,
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";
import * as apigw from "@aws-cdk/aws-apigateway";

export class CdkTestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here    // 👇 create the VPC
    const vpc = new ec2.Vpc(this, "my-cdk-vpc", {
      cidr: "10.0.0.0/16",
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    //setip database instance
    const dbInstance = new rds.DatabaseInstance(this, "db-instance", {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_2,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      multiAz: false,
      allocatedStorage: 200,
      maxAllocatedStorage: 512,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: "cdktestdb",
      publiclyAccessible: false,
    });

    // The Lambda function that contains the functionality
    const handler = new lambda.Function(this, "Lambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.resolve(__dirname, "lambda")),
      handler: "handler.handler",
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    dbInstance.grantConnect(handler);
    dbInstance.connections.allowFrom(handler, ec2.Port.tcp(5432));

    // An API Gateway to make the Lambda web-accessible
    const api = new apigw.LambdaRestApi(this, "Gateway", {
      description: "endpoint to get verison",
      handler,
      proxy: false,
    });

    const version = api.root.addResource("version");
    version.addMethod("GET");

    new CfnOutput(this, "НТТР API URL", {
      value: api.url ?? "Something went wrong with the deploy",
    });
  }
}
