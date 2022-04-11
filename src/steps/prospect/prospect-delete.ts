import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class DeleteProspect extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Pardot Prospect';
  protected stepExpression: string = 'delete the (?<email>.+) pardot prospect';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Email address',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;
    const buidName: string = stepData.businessUnitName;

    try {
      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }
      await this.client.deleteProspectByEmail(email, buid);
      return this.pass('Successfully deleted Prospect: %s', [email]);
    } catch (e) {
      if (e.toString().includes('Invalid value "undefined" for header "Pardot-Business-Unit-Id"')) {
        return this.fail('No Prospect found with email %s in Business Unit %s', [email, buidName]);
      }
      if (e.response && e.response.data.err === 'Invalid prospect email address') {
        return this.fail('No prospect found with email %s', [email]);
      }
      return this.error('There was a problem deleting the Prospect: %s', [e.toString()]);
    }
  }

}

export { DeleteProspect as Step };
