import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse, RecordDefinition } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/listMembership/list-membership-count';

chai.use(sinonChai);

describe('ListMembershipCount', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getListByName = sinon.stub();
    clientWrapperStub.getListMembershipsByListId = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ListMembershipCount');
      expect(stepDef.getName()).to.equal('Count a Pardot List Membership');
      expect(stepDef.getExpression()).to.equal('check the number of members from pardot list (?<listName>.+)');
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

      expect(fields[1].key).to.equal('listName');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('executeStep', () => {
    describe('List does not exist', () => {
      beforeEach(() => {
        const expectedListResponse = {
          nextPageToken: null,
          values: []
        }
        clientWrapperStub.getListByName.resolves(expectedListResponse);
        protoStep.setData(Struct.fromJavaScript({
          listName: 'anyName',
        }));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
    describe('List exists', () => {
      describe('Contains List Membership', () => {
        beforeEach(() => {
          const expectedListResponse = {
            nextPageToken: null,
            values: [{
              id: 'anyId',
            }]
          };
          const expectedListMembershipResponse = {
            nextPageToken: null,
            values: [{
              id: 'anyId',
            }]
          };
          clientWrapperStub.getListByName.resolves(expectedListResponse);
          clientWrapperStub.getListMembershipsByListId.resolves(expectedListMembershipResponse);
          protoStep.setData(Struct.fromJavaScript({
            listName: 'anyName',
          }));
        });
  
        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });
      });
      describe('Contains no List Membership', () => {
        beforeEach(() => {
          const expectedListResponse = {
            nextPageToken: null,
            values: [{
              id: 'anyId',
            }]
          };
          const expectedListMembershipResponse = {
            nextPageToken: null,
            values: []
          };
          clientWrapperStub.getListByName.resolves(expectedListResponse);
          clientWrapperStub.getListMembershipsByListId.resolves(expectedListMembershipResponse);
          protoStep.setData(Struct.fromJavaScript({
            listName: 'anyName',
          }));
        });
  
        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });
      });
    });
    describe('Throws an error', () => {
      beforeEach(() => {
        clientWrapperStub.getListByName.throws(new Error('anyMessage'));
        protoStep.setData(Struct.fromJavaScript({
          listName: 'anyName',
        }));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  })
});
