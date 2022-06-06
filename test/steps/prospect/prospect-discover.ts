import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/prospect/prospect-discover';

chai.use(sinonChai);

describe('DiscoverProspectStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.readByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DiscoverProspect');
      expect(stepDef.getName()).to.equal('Discover fields on a Pardot Prospect');
      expect(stepDef.getExpression()).to.equal('discover fields on pardot prospect (?<email>.+)');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('businessUnitName');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('email');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.EMAIL);
    });
  });

  describe('ExecuteStep', () => {

    describe('Prospect found', () => {
      const actualProspect = { email: 'test@pardot.com', age: 25 };

      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve(actualProspect));
        protoStep.setData(Struct.fromJavaScript(actualProspect));
      });

      it('should respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualProspect);
      });
    });

    describe('Prospect not found', () => {
      const expectedValues = {
        email: 'test@pardot.com',
        field: 'email',
        expectedValue: 'test@pardot.com',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
        clientWrapperStub.readByEmail.throws({response:{data:{err:'Invalid prospect email address'}}});
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Client Error', () => {
      const expectedValues = {
        email: 'test@pardot.com',
        field: 'email',
        expectedValue: 'test@pardot.com',
      };

      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
        clientWrapperStub.readByEmail.throws('some client error');
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

  });
});
