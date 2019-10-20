import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let needleConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    needleConstructorStub = sinon.stub();
    needleConstructorStub.defaults = {};
  });

});
