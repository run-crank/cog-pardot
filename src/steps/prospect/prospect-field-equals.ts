import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import { baseOperators } from '../../client/constants/operators';
import * as util from '@run-crank/utilities';
import { isNullOrUndefined } from 'util';

// tslint:disable:no-else-after-return
export class ProspectFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Pardot prospect';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on pardot prospect (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Prospect';
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Prospect\'s email address',
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
    id: 'prospect',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Prospect's Pardot ID",
    }, {
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: "Prospect's Email Address",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Prospect was created',
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Prospect was updated',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;
    const field: any = stepData.field;
    const expectedValue: any = stepData.expectedValue;
    const operator = stepData.operator || 'be';
    const buidName: string = stepData.businessUnitName;

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

      const prospect = await this.client.getProspectByEmail(email, buid);

      const records = this.createRecords(prospect, stepData['__stepOrder']);

      if (!prospect.hasOwnProperty(field)) {
        return this.fail('The %s field does not exist on Prospect %s', [field, email], records);
      }

      const result = this.assert(operator, prospect[field], expectedValue, field, stepData['__piiSuppressionLevel']);
      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      } else if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the prospect field: %s', [e.message]);
      } else if (e.response && e.response.data.err === 'Invalid prospect email address') {
        return this.fail('No prospect found with email %s', [email]);
      } else if (e.toString().includes('Invalid value "undefined" for header "Pardot-Business-Unit-Id"')) {
        return this.fail('No Prospect found with email %s in Business Unit %s', [email, buidName]);
      }
      return this.error('There was an error checking the prospect field: %s', [e.message]);
    }
  }

  public createRecords(prospect, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('prospect', 'Checked Prospect', prospect));
    // Ordered Record
    records.push(this.keyValue(`prospect.${stepOrder}`, `Checked Prospect from Step ${stepOrder}`, prospect));
    return records;
  }

}

export { ProspectFieldEquals as Step };
