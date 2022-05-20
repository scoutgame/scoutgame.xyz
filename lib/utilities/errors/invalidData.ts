import { SystemError } from './errors';

export class DuplicateDataError extends SystemError {
  constructor (message = 'Duplicate data was supplied') {
    super({
      errorType: 'Duplicate data',
      message,
      severity: 'warning'
    });
  }
}

export class StringTooShortError extends SystemError {
  constructor (message = 'The text provided is too short.') {
    super({
      errorType: 'Invalid input',
      message,
      severity: 'warning'
    });
  }
}

export class MissingDataError extends SystemError {
  constructor (message = 'Missing required data') {
    super({
      errorType: 'Invalid input',
      message,
      severity: 'warning'
    });
  }
}
