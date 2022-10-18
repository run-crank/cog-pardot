import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { isNullOrUndefined } from 'util';

// tslint:disable:no-else-after-return
export class DiscoverProspect extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Pardot Prospect';
  protected stepExpression: string = 'discover fields on pardot prospect (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Prospect\'s email address',
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

    try {
      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }

      const prospect = await this.client.getProspectByEmail(email, buid);

      if (!prospect) {
        return this.fail('No Prospect found with email %s in Business Unit %s', [email, buidName]);
      }

      const records = this.createRecords(prospect, stepData['__stepOrder']);

      return this.pass('Successfully discovered fields on prospect', [], records);

    } catch (e) {
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the prospect field: %s', [e.message]);
      } else if (e?.response?.data?.err === 'Invalid prospect email address') {
        return this.fail('No prospect found with email %s', [email]);
      } else if (e.toString().includes('Invalid value "undefined" for header "Pardot-Business-Unit-Id"')) {
        return this.fail('No Prospect found with email %s in Business Unit %s', [email, buidName]);
      }
      return this.error('There was an error discovering the prospect fields: %s', [e.message]);
    }
  }

  public createRecords(prospect, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('prospect', 'Discovered Prospect', prospect));
    // Ordered Record
    records.push(this.keyValue(`prospect.${stepOrder}`, `Discovered Prospect from Step ${stepOrder}`, prospect));
    return records;
  }

}

export { DiscoverProspect as Step };
