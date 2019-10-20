import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class CreateProspect extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Pardot Prospect';
  protected stepExpression: string = 'create a pardot prospect';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'prospect',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const prospect: any = stepData.prospect;

    try {
      if (!prospect.hasOwnProperty('email')) {
        return this.error('An email address must be provided in order to create a Pardot prospect');
      }

      const result = await this.client.createProspect(prospect);
      return this.pass('Successfully created Prospect with ID %s', [result.prospect.id]);
    } catch (e) {
      return this.error('There was a problem creating the Prospect: %s', [e.toString()]);
    }
  }

}

export { CreateProspect as Step };
