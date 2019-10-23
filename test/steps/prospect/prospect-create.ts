import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/prospect/prospect-create';

chai.use(sinonChai);

describe('CreateProspectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createProspect = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateProspect');
      expect(stepDef.getName()).to.equal('Create a Pardot Prospect');
      expect(stepDef.getExpression()).to.equal('create a pardot prospect');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('prospect');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('No email property', () => {
      const expectedProspect = {
        first_name: 'Pardot',
        last_name: 'Test',
      };

      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          prospect: expectedProspect,
        }));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Prospect created', () => {
      const expectedProspect = {
        email: 'test@pardot.com',
        first_name: 'Pardot',
        last_name: 'Test',
      };

      beforeEach(() => {
        clientWrapperStub.createProspect.returns(Promise.resolve({ prospect: { id: 18792341 } }));
        protoStep.setData(Struct.fromJavaScript({
          prospect: expectedProspect,
        }));
      });

      it('should call respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error', () => {
      const expectedProspect = {
        email: 'test@pardot.com',
        first_name: 'Pardot',
        last_name: 'Test',
      };

      beforeEach(() => {
        clientWrapperStub.createProspect.throws();
        protoStep.setData(Struct.fromJavaScript({
          prospect: expectedProspect,
        }));
      });

      it('should call respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
