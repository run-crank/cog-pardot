import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/tracker-domain/tracker-domain-field-equals';

chai.use(sinonChai);

describe('TrackerDomainFieldEqualsStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getTrackerDomainById = sinon.stub();
    clientWrapperStub.additionalBusinessUnits = {
      'anyName': 'anyValue'
    };
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('TrackerDomainFieldEquals');
      expect(stepDef.getName()).to.equal('Check a field on a Pardot tracker domain');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_]+) field on pardot tracker domain (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?');
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

      expect(fields[1].key).to.equal('id');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

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

      expect(records[0].id).to.equal('trackerDomain');
      expect(records[0].type).to.equal(RecordDefinition.Type.KEYVALUE);
      expect(records[0].mayHaveMoreFields).to.equal(true);
    });

  });

  describe('ExecuteStep', () => {

    describe('Email matched single trackerDomain', () => {
      const actualTrackerDomain = { id: '123123123', age: 25 };

      beforeEach(() => {
        clientWrapperStub.getTrackerDomainById.returns(Promise.resolve(actualTrackerDomain));
      });

      describe('Expected Value equals Actual Value', () => {
        const expectedValues = {
          id: '123123123',
          field: 'id',
          expectedValue: '123123123',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualTrackerDomain);
        });
      });

      describe('Field Not Found', () => {
        const expectedValues = {
          id: '123123123',
          field: 'no_such_field',
          expectedValue: '123123123',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with error', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualTrackerDomain);
        });
      });

      describe('Expected Value not equal Actual Value', () => {
        const expectedValues = {
          id: '123123123',
          field: 'id',
          expectedValue: 'wrong@pardot.com',
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript(expectedValues));
        });

        it('should respond with fail', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
          expect(response.getRecordsList()[0].getKeyValue().toJavaScript()).to.deep.equal(actualTrackerDomain);
        });
      });

      describe('Unknown Operator', () => {
        const fields = {
          id: '123123123',
          field: 'id',
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
          id: '123123123',
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

    describe('Tracker Domain not found', () => {
      const expectedValues = {
        id: '123123123',
        field: 'id',
        expectedValue: '123123123',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
        clientWrapperStub.getTrackerDomainById.throws({response:{data:{code:109}}});
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Invalid Business Unit Id', () => {
      const expectedValues = {
        businessUnitName: 'anyName',
        id: '123123123',
        field: 'id',
        expectedValue: '123123123',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
        clientWrapperStub.getTrackerDomainById.throws({response:{data:{code:181}}});
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Client Error', () => {
      const expectedValues = {
        id: '123123123',
        field: 'id',
        expectedValue: '123123123',
      };

      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(expectedValues));
        clientWrapperStub.getTrackerDomainById.throws({response:{data:{message:'anyMessage'}}});
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('No expectedValue provider on non be set operator', () => {
      const expectedValues = {
        id: '123123123',
        field: 'id',
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
