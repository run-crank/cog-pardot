import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition } from '../../../src/proto/cog_pb';
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
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on pardot prospect (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
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

      expect(fields[2].key).to.equal('field');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('operator');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[3].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[4].key).to.equal('expectedValue');
      expect(fields[4].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[4].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });

    it('should return expected step records', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const records: any[] = stepDef.getExpectedRecordsList().map((record: RecordDefinition) => {
        return record.toObject();
      });

      expect(records[0].id).to.equal('prospect');
      expect(records[0].type).to.equal(RecordDefinition.Type.KEYVALUE);
      expect(records[0].mayHaveMoreFields).to.equal(true);

      const idField = records[0].guaranteedFieldsList.filter(f => f.key === 'id')[0];
      expect(idField.type == FieldDefinition.Type.NUMERIC);
      const emailField = records[0].guaranteedFieldsList.filter(f => f.key === 'email')[0];
      expect(emailField.type == FieldDefinition.Type.EMAIL);
      const createField = records[0].guaranteedFieldsList.filter(f => f.key === 'created_at')[0];
      expect(createField.type == FieldDefinition.Type.DATETIME);
      const updateField = records[0].guaranteedFieldsList.filter(f => f.key === 'updated_at')[0];
      expect(updateField.type == FieldDefinition.Type.DATETIME);
    });

  });

  describe('ExecuteStep', () => {

    describe('Email matched single prospect', () => {
      const actualProspect = { email: 'test@pardot.com', age: 25 };

      beforeEach(() => {
        clientWrapperStub.readByEmail.returns(Promise.resolve(actualProspect));
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
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualProspect);
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
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualProspect);
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
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualProspect);
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

    describe('No expectedValue provider on non be set operator', () => {
      const expectedValues = {
        email: 'test@pardot.com',
        field: 'email',
        operator: 'be',
      };

      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
