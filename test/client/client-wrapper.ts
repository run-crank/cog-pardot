// import * as chai from 'chai';
// import { default as sinon } from 'ts-sinon';
// import * as sinonChai from 'sinon-chai';
// import 'mocha';
// import * as retry from 'retry';

// import { ClientWrapper } from '../../src/client/client-wrapper';
// import { Metadata } from 'grpc';

// chai.use(sinonChai);

// describe('ClientWrapper', () => {
//   const expect = chai.expect;
//   let pardotConstructorStub: any;
//   let pardotClientStub: any;
//   let metadata: Metadata;
//   let clientWrapperUnderTest: ClientWrapper;

//   beforeEach(() => {
//     pardotClientStub = {
//       prospects: {
//         create: sinon.spy(),
//       },
//     };

//     pardotConstructorStub = sinon.stub();
//     pardotConstructorStub.auth = sinon.stub();
//     pardotConstructorStub.auth.returns(Promise.resolve(pardotClientStub));
//   });

//   describe('constructor', () => {
//     const email = 'test@automatoninc.com';
//     const password = 'password';
//     const userKey = 'abc123';
//     beforeEach(() => {
//       metadata = new Metadata();
//       metadata.add('email', email);
//       metadata.add('password', password);
//       metadata.add('userKey', userKey);
//       pardotConstructorStub = sinon.stub();
//       pardotConstructorStub.auth = sinon.spy();
//     });

//     it('should call auth with expectedArgs', () => {
//       clientWrapperUnderTest = new ClientWrapper(metadata, pardotConstructorStub, retry);
//       expect(pardotConstructorStub.auth).to.have.been.calledWith(email, password, userKey);
//     });
//   });
// });
