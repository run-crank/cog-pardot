import { access } from 'fs';
import * as grpc from 'grpc';
const axios = require('axios').default;
import * as Retry from 'retry';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { ListMembershipAware, ProspectAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'pardotUrl',
    type: FieldDefinition.Type.STRING,
    description: 'Your pardot URL.',
    help: 'If you use a sandbox or developer account, your url is ".pardot.com", if you use a production instance, it is "pi.pardot.com"',
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Email address',
    help: "This is your (or an API user's) email address.",
  }, {
    field: 'password',
    type: FieldDefinition.Type.STRING,
    description: 'Password',
  }, {
    field: 'clientSecret',
    type: FieldDefinition.Type.STRING,
    description: 'Client Secret',
    help: 'You need to have a connected app set up to have a valid Client Secret.',
  }, {
    field: 'clientId',
    type: FieldDefinition.Type.STRING,
    description: 'Client ID',
    help: 'You need to have a connected app set up to have a valid Client ID.',
  }, {
    field: 'businessUnitId',
    type: FieldDefinition.Type.STRING,
    description: 'Business Unit ID',
  }];

  public retry: any;
  public client: any;
  public clientReady: Promise<boolean>;
  public loginUrl: any;
  public host: any;
  public accessToken: any;
  public businessUnitId: any;

  public LOGIN_ERROR_CODE: number = 15;
  public DAILY_API_LIMIT_EXCEEDED_ERROR_CODE: number = 122;
  public TIMEOUT: number = 60 * 1000;
  public MAX_CONCURRENT_REQUEST_ERROR_CODE: number = 66;

  constructor (auth: grpc.Metadata, clientConstructor = axios, retry = Retry) {
    this.retry = retry;
    this.client = axios;
    this.host = auth.get('pardotUrl');

    if (auth.get('pardotUrl').includes('demo') || auth.get('pardotUrl').includes('test')) {
      this.loginUrl = 'https://test.salesforce.com/services/oauth2/token';
    } else {
      this.loginUrl = 'https://login.salesforce.com/services/oauth2/token';
    }

    this.businessUnitId = auth.get('businessUnitId');

    this.clientReady = new Promise((resolve, reject) => {
      clientConstructor.post(this.loginUrl, {
        username: auth.get('email').toString(),
        password: auth.get('password').toString(),
        grant_type: 'password',
        client_secret: auth.get('clientSecret'),
        client_id: auth.get('clientId'),
      }).then((res: any) => {
        this.accessToken = res.access_token;
        resolve(true);
      }).fail((err: any) => {
        if (err.code === this.LOGIN_ERROR_CODE) {
          reject('Login failed. Please check your auth credentials and try again.');
        } else if (err.code === this.DAILY_API_LIMIT_EXCEEDED_ERROR_CODE) {
          reject('API call limit reached for today.');
        }
        reject(err);
      });
    });
  }

  public async attempt(fn: () => Promise<any>, retryCount = 1) {
    const operation = this.retry.operation({
      retries: retryCount,
      maxTimeout: this.TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      operation.attempt((currentAttempt: number) => {
        fn().then(resolve)
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

interface ClientWrapper extends ProspectAwareMixin, ListMembershipAware {}
applyMixins(ClientWrapper, [ProspectAwareMixin, ListMembershipAware]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
