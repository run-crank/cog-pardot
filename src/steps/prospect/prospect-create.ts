import { BaseStep, ExpectedRecord, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateProspect extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Pardot Prospect';
  protected stepExpression: string = 'create a pardot prospect';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'prospect',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }, {
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit to use',
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
    const prospect: any = stepData.prospect;
    const buidName: string = stepData.businessUnitName;

    try {
      if (!prospect.hasOwnProperty('email')) {
        return this.fail('An email address must be provided in order to create a Pardot prospect');
      }

      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }
      const result = await this.client.createProspect(prospect, buid);
      const prospectRecord = this.keyValue('prospect', 'Created Prospect', result.prospect);
      return this.pass('Successfully created Prospect with ID %s', [result.prospect.id], [prospectRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Prospect: %s', [e.toString()]);
    }
  }

}

export { CreateProspect as Step };
