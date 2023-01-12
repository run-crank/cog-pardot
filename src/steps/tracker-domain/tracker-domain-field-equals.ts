import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

// tslint:disable:no-else-after-return
export class TrackerDomainFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Pardot tracker domain';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on pardot tracker domain (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Tracker Domain';
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Tracker Domain\'s id',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'trackerDomain',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: "Tracker Domain's Pardot ID",
    }, {
      field: 'domain',
      type: FieldDefinition.Type.STRING,
      description: "Tracker Domain's Domain",
    }, {
      field: 'validationStatus',
      type: FieldDefinition.Type.STRING,
      description: "Tracker Domain's Validation Status",
    }, {
      field: 'sslStatus',
      type: FieldDefinition.Type.STRING,
      description: "Tracker Domain's SSL Status",
    }, {
      field: 'httpsStatus',
      type: FieldDefinition.Type.STRING,
      description: "Tracker Domain's HTTP Status",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const id: any = stepData.id;
    const field: any = stepData.field;
    const expectedValue: any = stepData.expectedValue;
    const operator = stepData.operator || 'be';
    const buidName: string = stepData.businessUnitName;
    const expectedPardotFields: string[] = [
      'id',
      'domain',
      'isPrimary',
      'isDeleted',
      'defaultCampaignId',
      'httpsStatus',
      'sslStatus',
      'sslStatusDetails',
      'sslRequestedById',
      'validationStatus',
      'validatedAt',
      'vanityUrlStatus',
      'trackingCode',
      'createdAt',
      'updatedAt',
      'createdById',
      'updatedById',
    ];

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }

      const trackerDomain = await this.client.getTrackerDomainById(id, expectedPardotFields, buid);

      const records = this.createRecords(trackerDomain, stepData['__stepOrder']);

      if (!trackerDomain.hasOwnProperty(field)) {
        return this.fail('The %s field does not exist on Tracker Domain %s', [field, id], records);
      }

      const result = this.assert(operator, trackerDomain[field], expectedValue, field, stepData['__piiSuppressionLevel']);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      console.log(e);
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      } else if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the trackerDomain field: %s', [e.message]);
      } else if (e.response.data.code === 109) {
        return this.fail('No trackerDomain found with id %s', [id]);
      } else if (e.response.data.code === 181) {
        return this.fail('No Tracker Domain found with id %s in Business Unit %s', [id, buidName]);
      }
      return this.error('There was an error checking the trackerDomain field: %s', [e.response.data.message]);
    }
  }

  public createRecords(trackerDomain, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('trackerDomain', 'Tracker Domain', trackerDomain));
    // Ordered Record
    records.push(this.keyValue(`trackerDomain.${stepOrder}`, `Tracker Domain from Step ${stepOrder}`, trackerDomain));
    return records;
  }
}

export { TrackerDomainFieldEquals as Step };
