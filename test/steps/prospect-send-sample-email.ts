import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/prospect-send-sample-email';

chai.use(sinonChai);

describe('ProspectSendSampleEmailStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.sendSampleEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ProspectSendSampleEmailStep');
      expect(stepDef.getName()).to.equal('Send Pardot Prospect Sample Email');
      expect(stepDef.getExpression()).to.equal('send a sample email to pardot prospect (?<emailAddress>.+\@.+\..+)');
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

      expect(fields[1].key).to.equal('campaignId');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('emailTemplateId');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);


      expect(fields[3].key).to.equal('toEmail');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[3].type).to.equal(FieldDefinition.Type.EMAIL);
    });
  });

  describe('ExecuteStep', () => {

    describe('email sent', () => {
      beforeEach(() => {
        clientWrapperStub.sendSampleEmail.resolves({
          email: {
            message: {
              text: 'anyText'
            },
          }
        });
        protoStep.setData(Struct.fromJavaScript({
          campaignId: 'anyCampaign',
          emailTemplateId: 'anyTemplate',
          toEmail: 'anyEmail@test.com',
        }));
      });

      it('should call respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('email response has error', () => {
      beforeEach(() => {
        clientWrapperStub.sendSampleEmail.returns(Promise.resolve({
          err: {
            anyKey: 'anyValue'
          }
        }));
        protoStep.setData(Struct.fromJavaScript({
          campaignId: 'anyCampaign',
          emailTemplateId: 'anyTemplate',
          toEmail: 'anyEmail@test.com',
        }));
      });

      it('should call respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('email throws an error', () => {
      beforeEach(() => {
        clientWrapperStub.sendSampleEmail.throws({
          response: {
            data: {
              anyKey: 'anyValue'
            },
          }
        });
        protoStep.setData(Struct.fromJavaScript({
          campaignId: 'anyCampaign',
          emailTemplateId: 'anyTemplate',
          toEmail: 'anyEmail@test.com',
        }));
      });

      it('should call respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
