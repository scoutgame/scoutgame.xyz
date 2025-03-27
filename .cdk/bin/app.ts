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

// Command example: cdk deploy --context name=stg-scoutgame-123
const stackNameParam: string = app.node.getContext('name');
const env = stackNameParam.startsWith('prd-') ? 'prd' : 'stg';
let appName = stackNameParam.replace(/^prd-/, '').replace(/^stg-/, '');
if (env === 'stg') {
  // find the index of a hyphen followed by a number (e.g. the PR number included in staging stack names)
  const hyphenIndex = appName.search(/-\d$/);
  if (hyphenIndex !== -1) {
    appName = appName.substring(0, hyphenIndex);
  }
}

const stackOptions = apps[appName]?.[env];

if (env === 'prd' && !stackOptions) {
  throw new Error('Invalid stack env: ' + stackNameParam);
}

console.log('Deploying stack env: ' + env + ' app: ' + appName);

if (env === 'prd') {
  new ProductionStack(app, stackNameParam, deployProps, stackOptions);
} else if (env === 'stg') {
  new StagingStack(app, stackNameParam, deployProps, stackOptions);
} else {
  throw new Error('Invalid stack env: ' + stackNameParam);
}
