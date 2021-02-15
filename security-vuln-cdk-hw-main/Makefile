ENV_NAME ?= sandbox
SERVICE_NAME = security-vuln-cdk-hw

AWS = aws

AWS_ACCOUNT_ID = $(shell $(AWS) sts get-caller-identity --output text --query 'Account')

SYNTH_OUT ?= cdk_stack
SERVERLESS_ROLE_ARN = arn:aws:iam::$(AWS_ACCOUNT_ID):role/$(ENV_NAME)_cdk_serverless_deployment_role

build: 
	npm run build

deploy:
	npm run cdk -- deploy $(ENV_NAME)-$(SERVICE_NAME)-$(BRANCH_NAME) \
	--output=$(SYNTH_OUT) \
	--role-arn=$(SERVERLESS_ROLE_ARN) \
	--context ENV_NAME=${ENV_NAME} \
	--context BRANCH_NAME=${BRANCH_NAME} \
	--context SLACK_MEMBER_ID=${SLACK_MEMBER_ID}

synth:
	npm run cdk -- synth \
	--output $(SYNTH_OUT) \
	--role-arn=$(SERVERLESS_ROLE_ARN) \
	--context ENV_NAME=${ENV_NAME} \
	--context BRANCH_NAME=${BRANCH_NAME} \
	--context SLACK_MEMBER_ID=${SLACK_MEMBER_ID}

diff:
	npm run cdk -- diff \
	--output $(SYNTH_OUT) \
	--context ENV_NAME=${ENV_NAME} \
	--context BRANCH_NAME=${BRANCH_NAME} \
	--context aws-cdk:enableDiffNoFail=true 2>&1


buildDiff: build diff

buildDeploy: build deploy

buildSynth: build synth
