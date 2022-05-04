import { SystemError, ISystemErrorInput } from 'lib/utilities/errors';

export class SpaceAccessDeniedError extends SystemError {

  constructor () {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: 'You do not have access to this space. Try again with a different user or API token'
    });
  }
}

export class NotFoundError extends SystemError {

  constructor () {
    super({
      severity: 'warning',
      errorType: 'Data not found',
      message: 'Data not found'
    });
  }
}

export class ActionNotPermittedError extends SystemError {

  constructor (message?: string) {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: message ?? 'You are not allowed to perform this action.'
    });
  }
}

export class UnknownError extends SystemError {
  constructor (error: any = {}) {
    super({
      errorType: 'Unknown',
      message: 'Something went wrong!',
      error,
      severity: 'error'
    });
  }
}

export class ApiError extends SystemError {

  constructor (errorInfo: Pick<ISystemErrorInput, 'errorType' | 'message'>) {
    super({
      errorType: errorInfo.errorType,
      message: errorInfo.message
    });

    this.severity = this.code >= 500 ? 'error' : 'warning';
  }
}
