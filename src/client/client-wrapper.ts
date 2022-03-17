import { access } from 'fs';
import * as grpc from 'grpc';
const axios = require('axios');
const formData = require('form-data');
import * as Retry from 'retry';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { ListMembershipAware, ProspectAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'pardotUrl',
    type: FieldDefinition.Type.STRING,
    description: 'Your Pardot Domain (If you are on a developer or sandbox account, enter "pi.demo.pardot.com", otherwise enter "pi.pardot.com")',
    help: 'If you use a sandbox or developer account, your url is "pi.demo.pardot.com", if you use a production instance, it is "pi.pardot.com"',
  }, {
    field: 'loginUrl',
    type: FieldDefinition.Type.STRING,
    description: 'The Salesforce Domain used to initiate a Pardot connection (If you are on a sandbox account, enter "https://test.salesforce.com/services/oauth2/token", otherwise enter "https://login.salesforce.com/services/oauth2/token")',
    help: 'If you use a sandbox account, your url is "https://test.salesforce.com/services/oauth2/token", if you use a developer or production instance, it is "https://login.salesforce.com/services/oauth2/token"',
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
    description: 'Default Business Unit ID',
  }];

  public retry: any;
  public client: any;
  public clientReady: Promise<boolean>;
  public loginUrl: any;
  public pardotUrl: any;
  public accessToken: any;
  public businessUnitId: any;
  public additionalBusinessUnits: any;

  public LOGIN_ERROR_CODE: number = 15;
  public DAILY_API_LIMIT_EXCEEDED_ERROR_CODE: number = 122;
  public TIMEOUT: number = 60 * 1000;
  public MAX_CONCURRENT_REQUEST_ERROR_CODE: number = 66;

  constructor (auth: grpc.Metadata, clientConstructor = axios, retry = Retry) {
    this.retry = retry;
    this.client = axios;
    this.pardotUrl = auth.get('pardotUrl').toString();
    this.loginUrl = auth.get('loginUrl').toString() || null;

    if (!this.loginUrl) {
      // in case their pardot account was set up before we added loginUrl to the auth fields
      if (this.pardotUrl.includes('demo')) {
        // Doesn't take into account developer accounts (they have 'demo' in the pardotUrl but use 'login.salesforce.com' for the loginUrl),
        // but is the best we can do for old accounts
        this.loginUrl = 'https://test.salesforce.com/services/oauth2/token';
      } else {
        this.loginUrl = 'https://login.salesforce.com/services/oauth2/token';
      }
    }

    if (auth.get('additionalBusinessUnits')) {
      this.additionalBusinessUnits = auth.get('additionalBusinessUnits'); // Used if the buidName provided to a step is anything other than 'default'
    }

    this.businessUnitId = auth.get('businessUnitId').toString(); // Only used if the buidName passed to a given step is 'default'

    this.clientReady = new Promise((resolve, reject) => {

      const data = new formData();
      data.append('username', auth.get('email').toString());
      data.append('password', auth.get('password').toString());
      data.append('grant_type', 'password');
      data.append('client_secret', auth.get('clientSecret').toString());
      data.append('client_id', auth.get('clientId').toString());

      const config = {
        data,
        method: 'post',
        url: this.loginUrl,
        headers: {
          ...data.getHeaders(),
        },
      };

      this.client(config)
      .then((res: any) => {
        this.accessToken = `Bearer ${res.data.access_token}`;
        resolve(true);
      })
      .catch((err: any) => {
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
