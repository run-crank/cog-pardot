import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class DeleteProspect extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Pardot Prospect';
  protected stepExpression: string = 'delete the (?<email>.+) pardot prospect';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Email address',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;

    try {
      await this.client.deleteProspectByEmail(email);
      return this.pass('Successfully deleted Prospect: %s', [email]);
    } catch (e) {
      return this.error('There was a problem deleting the Prospect: %s', [e.toString()]);
    }
  }

}

export { DeleteProspect as Step };
