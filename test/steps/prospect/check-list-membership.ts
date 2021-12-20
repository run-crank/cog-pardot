import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/listMembership/check-list-membership';

chai.use(sinonChai);

describe('CheckListMembership', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.readByEmail = sinon.stub();
    clientWrapperStub.readByListIdAndProspectId = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CheckListMembership');
      expect(stepDef.getName()).to.equal('Check Pardot List Membership');
      expect(stepDef.getExpression()).to.equal('the (?<email>.+) pardot prospect should (?<optInOut>be opted in to|be opted out of|not be a member of) list (?<listId>.+)');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('email');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.EMAIL);

      expect(fields[1].key).to.equal('optInOut');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('listId');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.NUMERIC);
    });
  });

  describe('executeStep', () => {

    describe('Prospect does not exist', () => {
      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve(undefined));
        protoStep.setData(Struct.fromJavaScript({
          email: 'invalid@thisisjust.atomatest.com',
          optInOut: 'not be a member of',
          listId: 1,
        }));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('List does not exist', () => {
      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve({ id: 1 }));
        clientWrapperStub.readByListIdAndProspectId.throws({
          response: {
            data: {
              err: 'anyError'
            }
          }
        });
      });

      describe('Expecting membership', () => {

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'valid@thisisjust.atomatest.com',
            optInOut: 'be opted in to',
            listId: 20,
          }));
          clientWrapperStub.readByListIdAndProspectId.throws({
            response: {
              data: {
                err: 'Invalid ID'
              }
            }
          });
        });

        it('should respond with error', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Expected to be not a member', () => {

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'valid@thisisjust.atomatest.com',
            optInOut: 'not be a member of',
            listId: 20,
          }));
          clientWrapperStub.readByListIdAndProspectId.throws({
            response: {
              data: {
                err: 'Invalid ID'
              }
            }
          });
        });

        it('should respond with passed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

      });
    });

    describe('Unexpected error when fetching list membership', () => {
      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve({ id: 200 }));

        protoStep.setData(Struct.fromJavaScript({
          email: 'valid@thisisjust.atomatest.com',
          optInOut: 'be opted in to',
          listId: 500,
        }));
        clientWrapperStub.readByListIdAndProspectId.throws({
          response: {
            data: {
              err: 'anyError'
            }
          }
        });
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Valid List and Prospect', () => {
      const listMembership: any = {};
      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve({ id: 200 }));
        clientWrapperStub.readByListIdAndProspectId.returns(Promise.resolve({ list_membership: listMembership }));
      });

      describe('Expected to be opted in', () => {
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'valid@thisisjust.atomatest.com',
            optInOut: 'be opted in to',
            listId: 400,
          }));
        });

        it('should respond with pass when opted_out is false', async () => {
          listMembership.opted_out = false;
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

        it('should respond with fail when opted_out is true', async () => {
          listMembership.opted_out = true;
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Expected to be opted out', () => {
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'valid@thisisjust.atomatest.com',
            optInOut: 'be opted out of',
            listId: 235,
          }));
        });

        it('should respond with pass when opted_out is true', async () => {
          listMembership.opted_out = true;
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

        it('should respond with fail when opted_out is false', async () => {
          listMembership.opted_out = false;
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Expected to not a member', () => {
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'valid@thisisjust.atomatest.com',
            optInOut: 'not be a member of',
            listId: 235,
          }));
        });

        it('should respond with fail regardless', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });
    });
  });
});
