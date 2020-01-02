import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/prospect/prospect-field-equals';

chai.use(sinonChai);

describe('ProspectFieldEqualsStep', () => {
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
      expect(stepDef.getStepId()).to.equal('ProspectFieldEquals');
      expect(stepDef.getName()).to.equal('Check a field on a Pardot Prospect');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on pardot prospect (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)');
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

      expect(fields[1].key).to.equal('field');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('operator');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('expectedValue');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[3].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {

    describe('Email matched single prospect', () => {
      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve(
            { email: 'test@pardot.com', age: 25 },
        ));
      });

      describe('Expected Value equals Actual Value', () => {
        const expectedValues = {
          email: 'test@pardot.com',
          field: 'email',
          expectedValue: 'test@pardot.com',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });
      });

      describe('Field Not Found', () => {
        const expectedValues = {
          email: 'test@pardot.com',
          field: 'no_such_field',
          expectedValue: 'test@pardot.com',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with error', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });

      describe('Expected Value not equal Actual Value', () => {
        const expectedValues = {
          email: 'test@pardot.com',
          field: 'email',
          expectedValue: 'wrong@pardot.com',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with fail', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Unknown Operator', () => {
        const fields = {
          email: 'test@pardot.com',
          field: 'email',
          expectedValue: 'wrong@pardot.com',
          operator: 'unknown operator',
        };

        it('should respond with error', async () => {
          protoStep.setData(Struct.fromJavaScript(fields));
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });

      describe('Invalid Operand', () => {
        const fields = {
          email: 'test@pardot.com',
          field: 'age',
          expectedValue: 'nonNumeric',
          operator: 'be greater than',
        };

        it('should respond with error', async () => {
          protoStep.setData(Struct.fromJavaScript(fields));
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
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
        clientWrapperStub.readByEmail.returns(Promise.resolve(undefined));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
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
