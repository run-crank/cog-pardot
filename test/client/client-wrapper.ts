import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';
import * as retry from 'retry';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let pardotConstructorStub: any;
  let pardotClientStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    pardotClientStub = {
      post: sinon.spy(),
    };

    pardotConstructorStub = sinon.stub();
    pardotConstructorStub.auth = sinon.stub();
    pardotConstructorStub.auth.returns(Promise.resolve(pardotClientStub));
  });

  describe('constructor', () => {
    const expectedCallArgs = {
        email: 'test@automatoninc.com',
        password: 'password',
        clientId: 'abc123',
        clientSecret: 'dnjffjsielwnwidofwneifowneoifsndoeifneose',
        pardotUrl: 'pi.demo.pardot.com',
        businessUnitId: '0UV00038474',
    }
    beforeEach(() => {
      metadata = new Metadata();
      metadata.add('email', expectedCallArgs.email);
      metadata.add('password', expectedCallArgs.password);
      metadata.add('clientId', expectedCallArgs.clientId);
      metadata.add('clientSecret', expectedCallArgs.clientSecret);
      metadata.add('pardotUrl', expectedCallArgs.pardotUrl);
      metadata.add('businessUnitId', expectedCallArgs.businessUnitId);
      pardotConstructorStub = sinon.stub();
      pardotConstructorStub.auth = sinon.spy();
    });

    
  });
});
