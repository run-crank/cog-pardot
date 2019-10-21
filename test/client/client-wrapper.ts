import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

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
//     const thenStub: any = sinon.stub();
//     thenStub.fail = sinon.stub();
//     const fakePromise = {
//       then: {
//         fail: sinon.stub(),
//       },
//     };
//     pardotConstructorStub = sinon.stub();
//     pardotConstructorStub.returns(fakePromise);
//   });

//   describe('Constructor', () => {
//     const expectedArgs = {
//       email: 'test@pardot.com',
//       password: 'password',
//       userKey: 'abc123',
//     };

//     it('should call pardotConstructorStub with expectedArgs', () => {
//       metadata = new Metadata();
//       metadata.add('email', expectedArgs.email);
//       metadata.add('password', expectedArgs.password);
//       metadata.add('userKey', expectedArgs.userKey);

//       clientWrapperUnderTest = new ClientWrapper(metadata, pardotConstructorStub);
//       expect(pardotConstructorStub).to.have.been.calledWith(expectedArgs);
//     });
//   });

//   describe('createProspect', () => {
//     const expectedEmail = 'test@pardot.com';
//     const expectedArgs = { email: expectedEmail, first_name: 'Pardot' };
//     beforeEach(() => {
//       pardotConstructorStub.returns(Promise.resolve(pardotClientStub));
//       metadata = new Metadata();
//       metadata.add('email', '');
//       metadata.add('password', '');
//       metadata.add('userKey', '');

//       clientWrapperUnderTest = new ClientWrapper(metadata, pardotConstructorStub);
//     });

//     it('should call prospects.create with expectedArgs', async () => {
//       await clientWrapperUnderTest.createProspect(expectedArgs);
//       expect(pardotClientStub.prospects.create)
//       .to.have.been.calledWith(expectedEmail, expectedArgs);
//     });
//   });
// });
