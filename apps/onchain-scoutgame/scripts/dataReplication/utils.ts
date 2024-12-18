

export function validateIsNotProductionDatabase() {
  if (!process.env.DATABASE_URL?.match('stg-app') && !process.env.DATABASE_URL?.match('127.0.0.1') && !process.env.DATABASE_URL?.match('localhost')) {
    throw new Error('This script is only meant to be run on local, staging or preprod database');
  }
}
