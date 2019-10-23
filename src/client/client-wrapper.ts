import * as grpc from 'grpc';
import * as pardot from 'lew-pardot';
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

  public client: pardot;
  public clientReady: Promise<boolean>;

  constructor (auth: grpc.Metadata, clientConstructor = pardot) {
    this.clientReady = new Promise((resolve, reject) => {
      clientConstructor({
        email: auth.get('email').toString(),
        password: auth.get('password').toString(),
        userKey: auth.get('userKey').toString(),
      }).then((client) => {
        this.client = client;
        resolve(true);
      }).fail((err) => {
        reject(`Auth Error: ${err}`);
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
