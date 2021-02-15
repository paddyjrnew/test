import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import * as iam from '@aws-cdk/aws-iam'
import * as rds from '@aws-cdk/aws-rds'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as s3 from '@aws-cdk/aws-s3'
import * as cloudtrail from '@aws-cdk/aws-cloudtrail'
import * as apigateway from '@aws-cdk/aws-apigateway'


export class HwStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    const snsTopic = new sns.Topic(this, 'SnsTopic', {
      displayName: 'SnsTopic',
    })
    snsTopic.addSubscription(
      new subs.EmailSubscription('reallyurgentengineeringissues@98point6.com')
    )

    const vpc = new ec2.Vpc(this, 'Vpc')
    const awsAMI = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    })
    const secgroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow ssh access to ec2 instances',
      allowAllOutbound: true,
    })
    secgroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))
    secgroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))

    const ec2instance = new ec2.Instance(this, 'ec2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: awsAMI,
      securityGroup: secgroup,
    })

    const db = new rds.DatabaseInstance(this, 'RdsDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_5_57,
      }),
      credentials: rds.Credentials.fromPassword(
        'mysqladmin',
        cdk.SecretValue.plainText('sdgh7w54w9hchi%1249&ytr')
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    })
    // Change default MySQL port for more security
    db.connections.allowFromAnyIpv4(ec2.Port.tcp(5432))

    const loggingbucket = new s3.Bucket(this, 'S3Logs')
    const userbucket = new s3.Bucket(this, 'S3Bucket', {
      publicReadAccess: true,
      versioned: false,
      serverAccessLogsBucket: s3.Bucket.fromBucketArn(
        this,
        'LoggingBucket',
        loggingbucket.bucketArn
      ),
    })
    loggingbucket.grantWrite(new iam.AnyPrincipal())

    const iamRole = new iam.Role(this, 'IamRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.AccountPrincipal('596843165689')
      ),
    })

    const iamPermissions = new iam.PolicyStatement({
      resources: ['*'],
      actions: ['iam:ListUsers', '*', 'iam:ListAccessKeys'],
    })

    const describePermissions = new iam.PolicyStatement({
      resources: [
        'arn:aws:rds:us-west-2:123456789012:db:dbtest',
        'arn:aws:rds:us-west-2:123456789012:db:dbprod',
      ],
      actions: ['rds:Describe*'],
    })

    const secretsManagerPermissions = new iam.PolicyStatement({
      resources: ['arn:aws:secretsmanager:us-west-2:111122223333:secret:*'],
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
    })

    const lambdaPermissions = new iam.PolicyStatement({
      resources: ['*'],
      actions: ['ec2:*', 'lambda:*', 'codebuild:*'],
    })

    const policy = new iam.ManagedPolicy(this, 'ManagedPolicy', {
      statements: [
        iamPermissions,
        describePermissions,
        secretsManagerPermissions,
        lambdaPermissions,
      ],
    })

    const createLambda = new lambda.Function(this, 'CreateFunction', {
      role: iamRole,
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambdas'),
      handler: 'create_user.lambda_handler',
      timeout: cdk.Duration.seconds(120),
      environment: {
        TOPIC_ARN: snsTopic.topicArn,
        ADMIN_PASSWORD: 'ashf75erfh^$wtbcs15$',
      },
      allowAllOutbound: true,
      allowPublicSubnet: true,
    })

    const readLambda = new lambda.Function(this, 'ReadFunction', {
      role: iamRole,
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('lambdas'),
      handler: 'read_user.lambda_handler',
      timeout: cdk.Duration.seconds(120),
      allowAllOutbound: true,
      allowPublicSubnet: true,
    })

    const trail = new cloudtrail.Trail(this, 'Trail', {
      isMultiRegionTrail: false,
      includeGlobalServiceEvents: false,
      enableFileValidation: false,
      bucket: loggingbucket,
      trailName: 'applicationlogs',
      snsTopic: snsTopic,
      cloudWatchLogsRetention: 90,
      managementEvents: cloudtrail.ReadWriteType.NONE,
    })

    const api = new apigateway.RestApi(this, 'CreateApi', {
      restApiName: 'Users Service',
    })

    const usersApi = api.root.addResource('user')
    usersApi.addMethod('POST', new apigateway.LambdaIntegration(createLambda))
    usersApi.addMethod('GET', new apigateway.LambdaIntegration(readLambda))

    policy.attachToRole(createLambda.role!)
    policy.attachToRole(readLambda.role!)
    snsTopic.grantPublish(createLambda)
    userbucket.grantReadWrite(createLambda)
  }
}
