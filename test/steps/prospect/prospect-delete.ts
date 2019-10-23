import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/prospect/prospect-delete';

chai.use(sinonChai);

describe('DeleteProspectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.deleteProspectByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeleteProspect');
      expect(stepDef.getName()).to.equal('Delete a Pardot Prospect');
      expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) pardot prospect');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('email');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.EMAIL);
    });
  });

  describe('ExecuteStep', () => {

    describe('Prospect deleted', () => {
      const expectedEmail = 'test@pardot.com';

      beforeEach(() => {
        clientWrapperStub.deleteProspectByEmail.returns(Promise.resolve());
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
        }));
      });

      it('should call respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error', () => {
      const expectedEmail = 'test@pardot.com';

      beforeEach(() => {
        clientWrapperStub.deleteProspectByEmail.throws();
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
        }));
      });

      it('should call respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
