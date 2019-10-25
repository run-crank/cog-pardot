import * as grpc from 'grpc';
import * as pardot from 'lew-pardot';
import * as Retry from 'retry';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { ProspectAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Email address',
  }, {
    field: 'password',
    type: FieldDefinition.Type.STRING,
    description: 'Password',
  }, {
    field: 'userKey',
    type: FieldDefinition.Type.STRING,
    description: 'User key',
  }];

  public retry: any;
  public client: pardot;
  public clientReady: Promise<boolean>;

  public LOGIN_ERROR_CODE: number = 15;
  public DAILY_API_LIMIT_EXCEEDED_ERROR_CODE: number = 122;
  public TIMEOUT: number = 60 * 1000;
  public MAX_CONCURRENT_REQUEST_ERROR_CODE: number = 66;

  constructor (auth: grpc.Metadata, clientConstructor = pardot, retry = Retry) {
    this.retry = retry;

    this.clientReady = new Promise((resolve, reject) => {
      clientConstructor({
        email: auth.get('email').toString(),
        password: auth.get('password').toString(),
        userKey: auth.get('userKey').toString(),
      }).then((client: any) => {
        this.client = client;
        resolve(true);
      }).fail((err: any) => {
        if (err.code === this.LOGIN_ERROR_CODE) {
          reject('Login failed. Please check your auth credentials and try again.');
        } else if (err.code === this.DAILY_API_LIMIT_EXCEEDED_ERROR_CODE) {
          reject('API call limit reached for today.');
        }
      });
    });
  }

  public async attempt(promise: Promise<any>, retryCount: number = 1) {
    const operation = this.retry.operation({
      retries: retryCount,
      maxTimeout: this.TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      operation.attempt((currentAttempt: number) => {
        promise.then(resolve)
        .catch((err: Error) => {
          // tslint:disable-next-line:max-line-length
          const shouldRetry = err['code'] === this.MAX_CONCURRENT_REQUEST_ERROR_CODE && currentAttempt - 1 !== retryCount;
          if (shouldRetry) {
            operation.retry(err);
          } else {
            reject(err);
          }
        });
      });
    });
  }
}

interface ClientWrapper extends ProspectAwareMixin {}
applyMixins(ClientWrapper, [ProspectAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
