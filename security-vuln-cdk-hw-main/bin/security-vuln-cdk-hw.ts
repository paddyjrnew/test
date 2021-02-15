#!/usr/bin/env node
import 'source-map-support/register'
import { App } from '@aws-cdk/core'
import { buildStack } from '../lib/security-vuln-cdk-hw-stack'
import * as cdke from 'cdk-extensions'
import { config } from '../config'

const app = new App()

const ENV = app.node.tryGetContext('ENV_NAME')
const SERVICE = app.node.tryGetContext('SERVICE_NAME')
const BRANCH = app.node.tryGetContext('BRANCH_NAME')
const REGION = app.node.tryGetContext('REGION')
const SLACK_MEMBER_ID = app.node.tryGetContext('SLACK_MEMBER_ID')

if (validBuildParameters()) {
  const props = {
    env: ENV as cdke._98point6Env,
    service: SERVICE,
    branch: BRANCH,
    region: REGION,
    config: config,
    slackMemberId: SLACK_MEMBER_ID,
    noLegacySubscriptionCleaner: true,
  }

  const stack = new cdke._98point6Stack(
    app,
    `${ENV}-${SERVICE}-${BRANCH}`,
    props
  )
  buildStack(stack)
}

function validBuildParameters(): boolean {
  let errors: string[] = []

  const emptyParams = Object.entries({
    ENV,
    SERVICE,
    BRANCH,
    REGION,
  }).filter(([key, value]): boolean => value == null)
  errors = emptyParams.map(([key, value]) => `${key} should not be nullish`)

  const envs = Object.values(cdke._98point6Env)
  const validEnv = envs.includes(ENV)
  if (!validEnv) {
    errors.push(`${ENV} should be one of: ${envs}`)
  }

  const ok = emptyParams.length === 0 && validEnv

  if (!ok) {
    console.log('Invalid build params')
    console.log(errors.map((e) => `\t${e}\n`).join())
  }

  return ok
}
