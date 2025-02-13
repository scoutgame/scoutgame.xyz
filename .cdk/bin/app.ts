#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductionStack } from '../ProductionStack';
import { StagingStack } from '../StagingStack';

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
const deployProps: cdk.StackProps = {
  env: { account: '310849459438', region: 'us-east-1' }
};

import { apps } from '../config';

const app = new cdk.App();

// Command example: cdk deploy --context name=stg-scoutgame
const stackNameParam: string = app.node.getContext('name');
const nameParamParts = stackNameParam.split('-');
const env = nameParamParts.shift() as string;

let appName = nameParamParts[0];
// hack to allow for onchain- apps that have a hyphen in their name
if (appName === 'onchain') {
  appName += '-' + nameParamParts[1];
}

const stackOptions = apps[appName]?.[env];

console.log('Deploying stack env: ' + env + ' app: ' + appName);

if (env === 'prd') {
  new ProductionStack(app, stackNameParam, deployProps, stackOptions);
} else if (env === 'stg') {
  new StagingStack(app, stackNameParam, deployProps, stackOptions);
} else {
  throw new Error('Invalid stack env: ' + stackNameParam);
}
