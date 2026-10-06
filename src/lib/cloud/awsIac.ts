import type { IacBundle } from './model';
import { cfnRanges, fillCount, fullFrom, starterFrom } from './iacText';

/**
 * The AWS capstone's infrastructure as code (R87): ONE CloudFormation
 * template for the company's final environment, authored with
 * `⟦FILL:hint|value⟧` markers — the reference and the Week 9 starter are both
 * derived from it. Logical ids ARE the diagram's node ids, and each resource's
 * `Metadata: Capstone: Week` says when it arrives.
 *
 * Soundness choices, stated in the course too:
 *  - the site bucket is private: CloudFront reads it through Origin Access
 *    Control, and the bucket policy names that one distribution;
 *  - the instance has no inbound rule at all — admin is Session Manager
 *    (outbound only), IMDSv2 is required and the disks are encrypted;
 *  - the Lambda role can update ONE table (its ARN), and the counter uses
 *    DynamoDB's atomic ADD, so two visitors at once never lose a count;
 *  - the private subnet has no route to the internet gateway at all.
 */

const SOURCE = `AWSTemplateFormatVersion: '2010-09-09'
Description: Capstone IT Services company - the whole environment, as code.

Parameters:
  TeamId:
    Type: String
    AllowedPattern: '^[a-z0-9]{3,8}$'
    Description: Your team, lowercase, e.g. team01. Goes into every name.
  Environment:
    Type: String
    AllowedValues: [dev, prod]
    Default: dev
  OwnerTag:
    Type: String
    Description: Who answers for these resources. Checked by the Week 11 required-tags rule.
  AlertEmail:
    Type: String
    Description: Where the budget and the error alarm send email.
  InstanceType:
    Type: String
    Default: ⟦FILL:the free-tier instance type|t3.micro⟧
    AllowedValues: [t3.micro, t2.micro]
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64
    Description: Always the current Amazon Linux 2023 image - no AMI id to look up.
  BudgetAmount:
    Type: Number
    Default: 5
    Description: Monthly budget in USD.
  ThroughWeek:
    Type: Number
    Default: 12
    AllowedValues: [4, 8, 12]
    Description: Deploy the environment as it stands at the end of this week - 4 (Cloud Practitioner), 8 (Solutions Architect) or 12 (everything).
  GithubRepository:
    Type: String
    Default: your-org/your-repo
    Description: owner/name of the GitHub repository the Week 10 pipeline deploys from - the OIDC role trusts exactly this repository.
  FleetSize:
    Type: Number
    Default: 0
    MinValue: 0
    MaxValue: 3
    Description: Instances in the Week 6 web fleet. 0 parks the fleet (free); 2 runs it across both zones (about $0.01 an hour beyond the free-tier instance).
  CreateDatabase:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: Create the Week 7 Multi-AZ PostgreSQL database (about $0.04 an hour while it exists). Leave false unless a task needs it.

Conditions:
  # Everything from Week 5 on exists only when the deployment reaches that far.
  Week5Plus: !Not [!Equals [!Ref ThroughWeek, 4]]
  # The DevOps course's resources (Weeks 9-12) exist only in the full deployment.
  Week9Plus: !Equals [!Ref ThroughWeek, 12]
  # The database bills by the hour, so it is opt-in even when the deployment reaches Week 7.
  WithDatabase: !And [!Not [!Equals [!Ref ThroughWeek, 4]], !Equals [!Ref CreateDatabase, 'true']]

Resources:
  MonthlyBudget:
    Type: AWS::Budgets::Budget
    Metadata:
      Capstone:
        Week: 1
        Summary: The $5 guardrail, set before anything can cost money.
    Properties:
      Budget:
        BudgetName: !Sub 'capstone-\${TeamId}'
        BudgetType: COST
        TimeUnit: MONTHLY
        BudgetLimit:
          Amount: !Ref BudgetAmount
          Unit: USD
      NotificationsWithSubscribers:
        - Notification:
            NotificationType: ACTUAL
            ComparisonOperator: GREATER_THAN
            Threshold: 80
            ThresholdType: PERCENTAGE
          Subscribers:
            - SubscriptionType: EMAIL
              Address: !Ref AlertEmail

  Vpc:
    Type: AWS::EC2::VPC
    Metadata:
      Capstone:
        Week: 1
        Summary: The company network.
    Properties:
      CidrBlock: ⟦FILL:the VPC address space|10.10.0.0/16⟧
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - { Key: Name, Value: !Sub 'vpc-capstone-\${TeamId}' }
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Metadata:
      Capstone:
        Week: 1
        Summary: The VPC's door to the internet.
    Properties:
      Tags:
        - { Key: Name, Value: !Sub 'igw-capstone-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  GatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Metadata:
      Capstone:
        Week: 1
        Summary: Hangs the internet gateway on the VPC.
    Properties:
      VpcId: !Ref Vpc
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Metadata:
      Capstone:
        Week: 1
        Summary: The public subnet - its route table points at the internet gateway.
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: ⟦FILL:the public subnet range|10.10.1.0/24⟧
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub 'snet-public-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Metadata:
      Capstone:
        Week: 1
        Summary: Routes for the public subnet.
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - { Key: Name, Value: !Sub 'rt-public-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PublicDefaultRoute:
    Type: AWS::EC2::Route
    DependsOn: GatewayAttachment
    Metadata:
      Capstone:
        Week: 1
        Summary: Everything not local goes to the internet gateway.
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Metadata:
      Capstone:
        Week: 1
        Summary: Makes the public subnet use the public route table.
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  ToolsSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Metadata:
      Capstone:
        Week: 2
        Summary: The instance's firewall - no inbound rule at all; admin is Session Manager.
    Properties:
      GroupDescription: IT tools server - no inbound, admin through Session Manager
      VpcId: !Ref Vpc
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: 0.0.0.0/0
          Description: Outbound for patches and the SSM agent
      Tags:
        - { Key: Name, Value: !Sub 'sg-tools-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The private subnet - no route to the internet gateway.
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: ⟦FILL:the private subnet range|10.10.2.0/24⟧
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub 'snet-private-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Routes for the private subnet - local only.
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - { Key: Name, Value: !Sub 'rt-private-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PrivateSubnetRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Makes the private subnet use the private route table.
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The second public subnet, in a second Availability Zone - what makes the fleet multi-AZ.
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: ⟦FILL:the second public subnet range|10.10.3.0/24⟧
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - { Key: Name, Value: !Sub 'snet-public-b-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PublicSubnetBRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The second public subnet uses the public route table too.
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The second private subnet - the database's subnet group needs two zones.
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: ⟦FILL:the second private subnet range|10.10.4.0/24⟧
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - { Key: Name, Value: !Sub 'snet-private-b-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  PrivateSubnetBRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The second private subnet uses the private route table.
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTable

  S3GatewayEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The free S3 gateway endpoint - private subnets reach S3 and the AL2023 repositories with no NAT.
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub 'com.amazonaws.\${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds: [!Ref PrivateRouteTable]

  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The load balancer's firewall - HTTP from the internet, nothing else.
    Properties:
      GroupDescription: ALB - 80 from the internet
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: The site, over HTTP, from anywhere
      Tags:
        - { Key: Name, Value: !Sub 'sg-alb-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  FleetIngressFromAlb:
    Type: AWS::EC2::SecurityGroupIngress
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Security-group chaining - the fleet accepts 80 only from the load balancer's group.
    Properties:
      GroupId: !Ref ToolsSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref AlbSecurityGroup
      Description: HTTP from the ALB only

  FleetLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The web instance written down - AL2023, nginx, IMDSv2, the SSM role, no key pair.
    Properties:
      LaunchTemplateName: !Sub 'lt-web-\${TeamId}'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile: { Arn: !GetAtt InstanceProfile.Arn }
        SecurityGroupIds: [!Ref ToolsSecurityGroup]
        MetadataOptions: { HttpTokens: required }
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs: { VolumeSize: 8, VolumeType: gp3, Encrypted: true }
        UserData:
          Fn::Base64: |
            #!/bin/bash
            dnf install -y nginx
            TOKEN=$(curl -sX PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
            AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
            echo "web OK from $AZ" > /usr/share/nginx/html/index.html
            systemctl enable --now nginx
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - { Key: Name, Value: !Sub 'web-\${TeamId}' }
              - { Key: owner, Value: !Ref OwnerTag }

  FleetTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Where the load balancer sends traffic, and the health check that drains a dead instance.
    Properties:
      Name: !Sub 'tg-web-\${TeamId}'
      VpcId: !Ref Vpc
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 10
      HealthyThresholdCount: 2
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  SiteAlb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: The Application Load Balancer across both public subnets - one address for two zones (about $0.0225 an hour).
    Properties:
      Name: !Sub 'alb-web-\${TeamId}'
      Scheme: internet-facing
      Type: application
      Subnets: [!Ref PublicSubnet, !Ref PublicSubnetB]
      SecurityGroups: [!Ref AlbSecurityGroup]
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  AlbListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Port 80 on the balancer forwards to the fleet's target group.
    Properties:
      LoadBalancerArn: !Ref SiteAlb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref FleetTargetGroup

  WebFleet:
    Type: AWS::AutoScaling::AutoScalingGroup
    Condition: Week5Plus
    DependsOn: PublicSubnetBRouteAssoc
    Metadata:
      Capstone:
        Week: 6
        Summary: The Auto Scaling group across both zones - FleetSize instances, replaced when they die, parked at 0.
    Properties:
      AutoScalingGroupName: !Sub 'asg-web-\${TeamId}'
      LaunchTemplate:
        LaunchTemplateId: !Ref FleetLaunchTemplate
        Version: !GetAtt FleetLaunchTemplate.LatestVersionNumber
      MinSize: '0'
      MaxSize: '3'
      DesiredCapacity: !Ref FleetSize
      VPCZoneIdentifier: [!Ref PublicSubnet, !Ref PublicSubnetB]
      TargetGroupARNs: [!Ref FleetTargetGroup]
      HealthCheckType: ELB
      HealthCheckGracePeriod: 120
      Tags:
        - { Key: owner, Value: !Ref OwnerTag, PropagateAtLaunch: true }

  FleetCpuPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 8
        Summary: Target tracking - keep the fleet's average CPU at 50% by adding and removing instances.
    Properties:
      AutoScalingGroupName: !Ref WebFleet
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification: { PredefinedMetricType: ASGAverageCPUUtilization }
        TargetValue: 50

  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: Both private subnets - the two zones a Multi-AZ database needs.
    Properties:
      DBSubnetGroupName: !Sub 'dbsg-\${TeamId}'
      DBSubnetGroupDescription: capstone private subnets
      SubnetIds: [!Ref PrivateSubnet, !Ref PrivateSubnetB]

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The database's firewall - PostgreSQL from the fleet's group only, never an address.
    Properties:
      GroupDescription: PostgreSQL from the fleet only
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ToolsSecurityGroup
          Description: PostgreSQL from the fleet
      Tags:
        - { Key: Name, Value: !Sub 'sg-db-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  Database:
    Type: AWS::RDS::DBInstance
    Condition: WithDatabase
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Metadata:
      Capstone:
        Week: 7
        Summary: Multi-AZ PostgreSQL, encrypted, private - the relational store for the company's next workload (opt-in, about $0.04 an hour).
    Properties:
      DBInstanceIdentifier: !Sub 'capstone-\${TeamId}-db'
      Engine: postgres
      DBInstanceClass: db.t3.micro
      AllocatedStorage: '20'
      StorageType: gp3
      MultiAZ: true
      StorageEncrypted: true
      PubliclyAccessible: false
      MasterUsername: capstone
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DbSubnetGroup
      VPCSecurityGroups: [!Ref DbSecurityGroup]
      BackupRetentionPeriod: 1
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  VisitsDeadLetterQueue:
    Type: AWS::SQS::Queue
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: Where a message the ledger cannot process goes after three tries, instead of blocking the rest.
    Properties:
      QueueName: !Sub 'capstone-\${TeamId}-visits-dlq'
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  VisitsQueue:
    Type: AWS::SQS::Queue
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The queue between the API and the ledger - the front door answers fast, the write happens when it can.
    Properties:
      QueueName: !Sub 'capstone-\${TeamId}-visits'
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt VisitsDeadLetterQueue.Arn
        maxReceiveCount: 3
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  LedgerFunctionRole:
    Type: AWS::IAM::Role
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The ledger's role - put to one table, read from one queue, write its own logs.
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: ledger
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: dynamodb:PutItem
                Resource: !GetAtt VisitorTable.Arn
              - Effect: Allow
                Action: [sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes]
                Resource: !GetAtt VisitsQueue.Arn

  LedgerFunction:
    Type: AWS::Lambda::Function
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: Writes one item per queued visit; a message with no page is an error, and lands in the dead-letter queue.
    Properties:
      FunctionName: !Sub 'capstone-\${TeamId}-ledger'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt LedgerFunctionRole.Arn
      Timeout: 10
      Environment:
        Variables:
          TABLE: !Ref VisitorTable
      Code:
        ZipFile: |
          import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
          const db = new DynamoDBClient({});
          export const handler = async (event) => {
            for (const r of event.Records) {
              const body = JSON.parse(r.body);
              if (!body.page) throw new Error("no page");
              await db.send(new PutItemCommand({ TableName: process.env.TABLE, Item: { id: { S: "visit#" + r.messageId }, page: { S: body.page }, at: { N: String(Date.now()) } } }));
            }
          };
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  LedgerEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: Lambda polls the visits queue and hands the ledger batches of up to ten.
    Properties:
      EventSourceArn: !GetAtt VisitsQueue.Arn
      FunctionName: !Ref LedgerFunction
      BatchSize: 10

  FleetGreenTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 11
        Summary: The green target group - where the next release's fleet registers while blue still serves.
    Properties:
      Name: !Sub 'tg-web-green-\${TeamId}'
      VpcId: !Ref Vpc
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 10
      HealthyThresholdCount: 2
      Tags:
        - { Key: owner, Value: !Ref OwnerTag }

  OpsDashboard:
    Type: AWS::CloudWatch::Dashboard
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 11
        Summary: The service levels on one screen - healthy targets, p95 latency, 5XX and function errors (free).
    Properties:
      DashboardName: !Sub 'capstone-\${TeamId}'
      DashboardBody: !Sub
        - '{"widgets":[{"type":"metric","x":0,"y":0,"width":12,"height":6,"properties":{"title":"Availability and latency","region":"\${AWS::Region}","metrics":[["AWS/ApplicationELB","HealthyHostCount","LoadBalancer","\${Lb}","TargetGroup","\${Tg}"],["AWS/ApplicationELB","TargetResponseTime","LoadBalancer","\${Lb}",{"stat":"p95"}]]}},{"type":"metric","x":12,"y":0,"width":12,"height":6,"properties":{"title":"Errors","region":"\${AWS::Region}","metrics":[["AWS/ApplicationELB","HTTPCode_Target_5XX_Count","LoadBalancer","\${Lb}"],["AWS/Lambda","Errors","FunctionName","\${CounterFunction}"],["AWS/Lambda","Errors","FunctionName","\${LedgerFunction}"]]}}]}'
        - { Lb: !GetAtt SiteAlb.LoadBalancerFullName, Tg: !GetAtt FleetTargetGroup.TargetGroupFullName }

  InstanceRole:
    Type: AWS::IAM::Role
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Lets the instance talk to Session Manager - replaces SSH.
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: ec2.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/AmazonSSMManagedInstanceCore'

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 6
        Summary: Carries the instance role onto the instance.
    Properties:
      Roles: [!Ref InstanceRole]

  ToolsInstance:
    Type: AWS::EC2::Instance
    DependsOn: PublicDefaultRoute
    Metadata:
      Capstone:
        Week: 2
        Summary: The internal IT tools server - Amazon Linux 2023, IMDSv2, encrypted disk.
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds: [!Ref ToolsSecurityGroup]
      IamInstanceProfile: !If [Week5Plus, !Ref InstanceProfile, !Ref AWS::NoValue]
      MetadataOptions:
        HttpTokens: required
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
      UserData:
        Fn::Base64: |
          #!/bin/bash
          dnf install -y nginx
          echo 'IT tools server OK' > /usr/share/nginx/html/index.html
          systemctl enable --now nginx
      Tags:
        - { Key: Name, Value: !Sub 'ec2-tools-\${TeamId}' }
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  DataVolume:
    Type: AWS::EC2::Volume
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: The instance's second disk, for data that must outlive the OS.
    Properties:
      AvailabilityZone: !GetAtt ToolsInstance.AvailabilityZone
      Size: 8
      VolumeType: gp3
      Encrypted: true
      Tags:
        - { Key: Name, Value: !Sub 'ebs-data-tools-\${TeamId}' }
        - { Key: owner, Value: !Ref OwnerTag }

  DataVolumeAttachment:
    Type: AWS::EC2::VolumeAttachment
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 7
        Summary: Plugs the data volume into the instance.
    Properties:
      InstanceId: !Ref ToolsInstance
      VolumeId: !Ref DataVolume
      Device: /dev/sdf

  SiteBucket:
    Type: AWS::S3::Bucket
    Metadata:
      Capstone:
        Week: 2
        Summary: Holds the website files - private, encrypted, versioned (Week 8).
    Properties:
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  SiteOac:
    Type: AWS::CloudFront::OriginAccessControl
    Metadata:
      Capstone:
        Week: 2
        Summary: The identity CloudFront uses to read the private bucket.
    Properties:
      OriginAccessControlConfig:
        Name: !Sub 'capstone-\${TeamId}-site-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  SiteDistribution:
    Type: AWS::CloudFront::Distribution
    Metadata:
      Capstone:
        Week: 2
        Summary: Serves the site over HTTPS worldwide - the S3 website endpoint alone is HTTP only.
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        HttpVersion: http2
        PriceClass: PriceClass_100
        Origins:
          - Id: s3-site
            DomainName: !GetAtt SiteBucket.RegionalDomainName
            OriginAccessControlId: !GetAtt SiteOac.Id
            S3OriginConfig:
              OriginAccessIdentity: ''
        DefaultCacheBehavior:
          TargetOriginId: s3-site
          ViewerProtocolPolicy: ⟦FILL:what happens to plain HTTP|redirect-to-https⟧
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          Compress: true
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  SiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Metadata:
      Capstone:
        Week: 2
        Summary: Lets exactly one CloudFront distribution read the bucket - nobody else.
    Properties:
      Bucket: !Ref SiteBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowThisDistributionOnly
            Effect: Allow
            Principal: { Service: cloudfront.amazonaws.com }
            Action: s3:GetObject
            Resource: !Sub '\${SiteBucket.Arn}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub 'arn:\${AWS::Partition}:cloudfront::\${AWS::AccountId}:distribution/\${SiteDistribution}'

  VisitorTable:
    Type: AWS::DynamoDB::Table
    Metadata:
      Capstone:
        Week: 3
        Summary: Holds the visitor counter item (id site). Point-in-time recovery from Week 8.
    Properties:
      BillingMode: ⟦FILL:pay per request, no idle cost|PAY_PER_REQUEST⟧
      AttributeDefinitions:
        - AttributeName: ⟦FILL:the partition key attribute|id⟧
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  TableNameParameter:
    Type: AWS::SSM::Parameter
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 5
        Summary: Publishes the table name in Parameter Store - configuration, not a secret.
    Properties:
      Name: !Sub '/capstone/\${TeamId}/visitor/table'
      Type: String
      Value: !Ref VisitorTable

  CounterFunctionRole:
    Type: AWS::IAM::Role
    Metadata:
      Capstone:
        Week: 3
        Summary: The Lambda's permissions - write its logs, update ONE table, nothing else.
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: count-visitors
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: [dynamodb:UpdateItem, dynamodb:GetItem]
                Resource: !GetAtt VisitorTable.Arn

  CounterFunction:
    Type: AWS::Lambda::Function
    Metadata:
      Capstone:
        Week: 3
        Summary: The visitor-counter code - one atomic update per visit.
    Properties:
      FunctionName: !Sub 'capstone-\${TeamId}-counter'
      Runtime: ⟦FILL:the Python runtime|python3.12⟧
      Handler: index.handler
      Role: !GetAtt CounterFunctionRole.Arn
      Timeout: 5
      MemorySize: 128
      Environment:
        Variables:
          TABLE_NAME: !Ref VisitorTable
      Code:
        ZipFile: |
          import json, os, boto3
          table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

          def handler(event, context):
              r = table.update_item(
                  Key={"id": "site"},
                  UpdateExpression="ADD #c :one",
                  ExpressionAttributeNames={"#c": "count"},
                  ExpressionAttributeValues={":one": 1},
                  ReturnValues="UPDATED_NEW",
              )
              return {
                  "statusCode": 200,
                  "headers": {"Content-Type": "application/json"},
                  "body": json.dumps({"count": int(r["Attributes"]["count"])}),
              }
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  HttpApi:
    Type: AWS::ApiGatewayV2::Api
    Metadata:
      Capstone:
        Week: 3
        Summary: The public HTTPS front door for the counter. CORS admits only the site.
    Properties:
      Name: !Sub 'capstone-\${TeamId}-api'
      ProtocolType: HTTP
      CorsConfiguration:
        AllowOrigins:
          - !Sub 'https://\${SiteDistribution.DomainName}'
        AllowMethods: [⟦FILL:the one method the site uses|GET⟧]
        AllowHeaders: [content-type]
        MaxAge: 300

  ApiIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Metadata:
      Capstone:
        Week: 3
        Summary: Connects the API to the Lambda function.
    Properties:
      ApiId: !Ref HttpApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !GetAtt CounterFunction.Arn
      PayloadFormatVersion: '2.0'

  ApiRoute:
    Type: AWS::ApiGatewayV2::Route
    Metadata:
      Capstone:
        Week: 3
        Summary: GET /count goes to the integration.
    Properties:
      ApiId: !Ref HttpApi
      RouteKey: GET /count
      Target: !Sub 'integrations/\${ApiIntegration}'

  ApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Metadata:
      Capstone:
        Week: 3
        Summary: The default stage - changes deploy automatically.
    Properties:
      ApiId: !Ref HttpApi
      StageName: $default
      AutoDeploy: true

  ApiInvokePermission:
    Type: AWS::Lambda::Permission
    Metadata:
      Capstone:
        Week: 3
        Summary: Lets this API - and only this route - invoke the function.
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref CounterFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:\${AWS::Partition}:execute-api:\${AWS::Region}:\${AWS::AccountId}:\${HttpApi}/*/*/count'

  CounterLogGroup:
    Type: AWS::Logs::LogGroup
    Metadata:
      Capstone:
        Week: 4
        Summary: Where the function's logs land - kept two weeks.
    Properties:
      LogGroupName: !Sub '/aws/lambda/capstone-\${TeamId}-counter'
      RetentionInDays: 14

  AlertTopic:
    Type: AWS::SNS::Topic
    Metadata:
      Capstone:
        Week: 4
        Summary: Who gets told when an alarm fires.
    Properties:
      TopicName: !Sub 'capstone-\${TeamId}-alerts'
      Subscription:
        - Protocol: email
          Endpoint: !Ref AlertEmail

  FunctionErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Metadata:
      Capstone:
        Week: 4
        Summary: Fires when the counter function throws an error.
    Properties:
      AlarmDescription: The visitor-counter function failed.
      Namespace: AWS/Lambda
      MetricName: Errors
      Dimensions:
        - Name: FunctionName
          Value: !Ref CounterFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref AlertTopic]

  ReadOnlyGroup:
    Type: AWS::IAM::Group
    Metadata:
      Capstone:
        Week: 3
        Summary: The team's IAM group - it can look at everything and change nothing.
    Properties:
      ManagedPolicyArns:
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/ReadOnlyAccess'

  BackupVault:
    Type: AWS::Backup::BackupVault
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 8
        Summary: Where AWS Backup keeps the recovery points - the vault itself costs nothing.
    Properties:
      BackupVaultName: !Sub 'capstone-\${TeamId}-vault'
      BackupVaultTags:
        project: capstone
        owner: !Ref OwnerTag

  BackupRole:
    Type: AWS::IAM::Role
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 8
        Summary: Lets AWS Backup snapshot the data volume on the team's behalf.
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: backup.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup'
        - !Sub 'arn:\${AWS::Partition}:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores'

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 8
        Summary: A daily recovery point of the data volume, kept 35 days - the RPO the DR plan promises.
    Properties:
      BackupPlan:
        BackupPlanName: !Sub 'capstone-\${TeamId}-daily'
        BackupPlanRule:
          - RuleName: daily-0300-utc
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 3 * * ? *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 180
            Lifecycle:
              DeleteAfterDays: 35

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Condition: Week5Plus
    Metadata:
      Capstone:
        Week: 8
        Summary: Which resources the plan protects - the data volume, named by ARN.
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: data-volume
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub 'arn:\${AWS::Partition}:ec2:\${AWS::Region}:\${AWS::AccountId}:volume/\${DataVolume}'

  GithubOidcProvider:
    Type: AWS::IAM::OIDCProvider
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 10
        Summary: Trusts GitHub's OIDC tokens, so the pipeline signs in with no stored access key.
    Properties:
      Url: https://token.actions.githubusercontent.com
      ClientIdList: [sts.amazonaws.com]
      ThumbprintList: [6938fd4d98bab03faadb97b34396831e3780aea1]
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  DeployRole:
    Type: AWS::IAM::Role
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 10
        Summary: The role GitHub Actions assumes - one repository, and only what a deploy needs.
    Properties:
      RoleName: !Sub 'capstone-\${TeamId}-deploy'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Federated: !GetAtt GithubOidcProvider.Arn }
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                token.actions.githubusercontent.com:aud: sts.amazonaws.com
              StringLike:
                token.actions.githubusercontent.com:sub: !Sub 'repo:\${GithubRepository}:*'
      Policies:
        - PolicyName: deploy-site-and-code
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: [s3:PutObject, s3:DeleteObject, s3:ListBucket]
                Resource: [!GetAtt SiteBucket.Arn, !Sub '\${SiteBucket.Arn}/*']
              - Effect: Allow
                Action: cloudfront:CreateInvalidation
                Resource: !Sub 'arn:\${AWS::Partition}:cloudfront::\${AWS::AccountId}:distribution/\${SiteDistribution}'
              - Effect: Allow
                Action: lambda:UpdateFunctionCode
                Resource: !GetAtt CounterFunction.Arn
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  TrailBucket:
    Type: AWS::S3::Bucket
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 11
        Summary: Where CloudTrail writes the account's audit log - private, encrypted, versioned.
    Properties:
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

  TrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: Week9Plus
    Metadata:
      Capstone:
        Week: 11
        Summary: Lets exactly one trail write to the bucket - nobody else.
    Properties:
      Bucket: !Ref TrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowTrailAclCheck
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:GetBucketAcl
            Resource: !GetAtt TrailBucket.Arn
          - Sid: AllowTrailWrite
            Effect: Allow
            Principal: { Service: cloudtrail.amazonaws.com }
            Action: s3:PutObject
            Resource: !Sub '\${TrailBucket.Arn}/AWSLogs/\${AWS::AccountId}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  Trail:
    Type: AWS::CloudTrail::Trail
    Condition: Week9Plus
    DependsOn: TrailBucketPolicy
    Metadata:
      Capstone:
        Week: 11
        Summary: Every management call in the account, written to the bucket - the audit trail governance reads.
    Properties:
      TrailName: !Sub 'capstone-\${TeamId}-trail'
      S3BucketName: !Ref TrailBucket
      IsLogging: true
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      Tags:
        - { Key: project, Value: capstone }
        - { Key: owner, Value: !Ref OwnerTag }

Outputs:
  SiteUrl:
    Description: The website's HTTPS address.
    Value: !Sub 'https://\${SiteDistribution.DomainName}'
  ApiUrl:
    Description: The visitor-counter API - goes into config.json.
    Value: !Sub 'https://\${HttpApi}.execute-api.\${AWS::Region}.amazonaws.com/count'
  InstanceId:
    Description: The IT tools server - open it with Session Manager.
    Value: !Ref ToolsInstance
  SiteBucketName:
    Description: Where the site files are uploaded.
    Value: !Ref SiteBucket
  DistributionId:
    Description: Needed to invalidate the cache after an upload.
    Value: !Ref SiteDistribution
  VisitorTableName:
    Description: The table that holds the count.
    Value: !Ref VisitorTable
  SiteAlbDns:
    Condition: Week5Plus
    Description: The load balancer's address - the fleet answers here from either zone.
    Value: !GetAtt SiteAlb.DNSName
  DatabaseEndpoint:
    Condition: WithDatabase
    Description: The PostgreSQL endpoint - private; reachable from the fleet only.
    Value: !GetAtt Database.Endpoint.Address
  DeployRoleArn:
    Condition: Week9Plus
    Description: The role the Week 10 workflow assumes - goes into the repository as AWS_ROLE_ARN.
    Value: !GetAtt DeployRole.Arn
`;

const PARAMS_DEV = `[
  { "ParameterKey": "TeamId", "ParameterValue": "team01" },
  { "ParameterKey": "Environment", "ParameterValue": "dev" },
  { "ParameterKey": "OwnerTag", "ParameterValue": "team01-lead" },
  { "ParameterKey": "AlertEmail", "ParameterValue": "team01@example.com" },
  { "ParameterKey": "InstanceType", "ParameterValue": "t3.micro" },
  { "ParameterKey": "BudgetAmount", "ParameterValue": "5" },
  { "ParameterKey": "FleetSize", "ParameterValue": "0" },
  { "ParameterKey": "CreateDatabase", "ParameterValue": "false" }
]
`;

const PARAMS_PROD = `[
  { "ParameterKey": "TeamId", "ParameterValue": "team01" },
  { "ParameterKey": "Environment", "ParameterValue": "prod" },
  { "ParameterKey": "OwnerTag", "ParameterValue": "team01-lead" },
  { "ParameterKey": "AlertEmail", "ParameterValue": "team01@example.com" },
  { "ParameterKey": "InstanceType", "ParameterValue": "t3.micro" },
  { "ParameterKey": "BudgetAmount", "ParameterValue": "20" },
  { "ParameterKey": "FleetSize", "ParameterValue": "2" },
  { "ParameterKey": "CreateDatabase", "ParameterValue": "false" }
]
`;

const FULL = fullFrom(SOURCE);

export const AWS_IAC: IacBundle = {
  platform: 'aws',
  tool: 'CloudFormation',
  full: { name: 'template.yaml', lang: 'yaml', text: FULL },
  starter: { name: 'template.starter.yaml', lang: 'yaml', text: starterFrom(SOURCE, 'yaml') },
  fillCount: fillCount(SOURCE),
  parameters: [
    { name: 'params-dev.json', lang: 'json', text: PARAMS_DEV },
    { name: 'params-prod.json', lang: 'json', text: PARAMS_PROD },
  ],
  outputs: [
    { name: 'SiteUrl', description: 'The website’s HTTPS address (CloudFront).' },
    { name: 'ApiUrl', description: 'The visitor-counter API — goes into config.json.' },
    { name: 'InstanceId', description: 'The IT tools server — open it with Session Manager.' },
    { name: 'SiteBucketName', description: 'Where the site files are uploaded.' },
    { name: 'DistributionId', description: 'Needed to invalidate CloudFront’s cache after an upload.' },
    { name: 'VisitorTableName', description: 'The table that holds the count.' },
    { name: 'DeployRoleArn', description: 'The role the Week 10 workflow assumes — goes into the repository as AWS_ROLE_ARN (full deployment only).' },
    { name: 'SiteAlbDns', description: 'The Week 6 load balancer’s address (Week 5+ deployments).' },
    { name: 'DatabaseEndpoint', description: 'The Week 7 PostgreSQL endpoint (only when CreateDatabase is true).' },
  ],
  resources: cfnRanges(FULL),
  commands: [
    { label: 'Name the stack', cmd: 'STACK=capstone-team01' },
    { label: 'Check the template before anything changes', cmd: 'aws cloudformation validate-template --template-body file://template.yaml' },
    { label: 'Preview exactly what will change (change set)', cmd: 'aws cloudformation create-change-set --stack-name $STACK --change-set-name preview --change-set-type CREATE --template-body file://template.yaml --parameters file://params-dev.json --capabilities CAPABILITY_IAM' },
    { label: 'Read the preview', cmd: 'aws cloudformation describe-change-set --stack-name $STACK --change-set-name preview --query "Changes[].ResourceChange.[Action,LogicalResourceId,ResourceType]" --output table' },
    { label: 'Deploy', cmd: 'aws cloudformation execute-change-set --stack-name $STACK --change-set-name preview && aws cloudformation wait stack-create-complete --stack-name $STACK' },
  ],
  notes: [
    'Deploy in us-east-1: CloudFront, its certificates and billing features all live there, and it keeps the course’s screenshots matching yours.',
    'The S3 website endpoint is HTTP only. HTTPS comes from CloudFront, which reads the private bucket through Origin Access Control.',
    'The Lambda code is inline for Week 3 simplicity. From Week 10 it ships through GitHub Actions instead.',
    'Deploy with ThroughWeek=4 or 8 to get the environment exactly as the Cloud Practitioner or the Solutions Architect course leaves it; every later resource carries the Week5Plus condition.',
    'The instance keeps a public IP only so it can reach patches and Session Manager. Production would use a NAT gateway; this course avoids its monthly cost and opens no inbound port instead.',
    'AWS Config (the Week 11 required-tags rule) is set up in the console, not here: an account can have only one configuration recorder per region, and yours may already exist. CloudTrail, which has no such limit, is in the template.',
    'AWS Backup protects the data volume with a daily plan from Week 8. The vault and the plan are free; each recovery point is an EBS snapshot and bills like one (cents).',
    'Deploy with ThroughWeek=12 for the DevOps course’s resources: the GitHub OIDC provider and deploy role (Week 10) and the audit trail (Week 11) carry the Week9Plus condition.',
    'R106: the Solutions Architect quarter builds a two-zone fleet behind an Application Load Balancer, a Multi-AZ PostgreSQL database and a visits queue with a dead-letter queue. The fleet deploys parked (FleetSize 0, free) and the database is opt-in (CreateDatabase), because both bill by the hour; the balancer bills about $0.0225 an hour whenever the Week 5+ deployment exists.',
    'The Session Manager interface endpoints the Week 6 Security task uses are created and deleted inside that task, not here: three of them cost about $22 a month. The free S3 gateway endpoint is in the template.',
    'The DevOps quarter adds the green target group (the fleet’s blue/green release registers there) and the dashboard of the service levels. The Week 11 function canary is a Lambda alias with weights, set from the pipeline and the CLI, not here: a template that owned the alias would reset the weight on every deploy.',
  ],
};
