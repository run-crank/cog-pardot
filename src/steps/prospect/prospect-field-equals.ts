import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

// tslint:disable:no-else-after-return
export class ProspectFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Pardot Prospect';
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on pardot prospect (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
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
    description: 'Check Logic',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;
    const field: any = stepData.field;
    const expectedValue: any = stepData.expectedValue;
    const operator = stepData.operator || 'be';

    try {
      const prospect = await this.client.readByEmail(email);

      if (!prospect) {
        return this.error('No prospect found with email %s', [email]);
      } else if (!prospect.hasOwnProperty(field)) {
        return this.error('The %s field does not exist on Prospect %s', [
          field,
          email,
        ]);
      // tslint:disable-next-line:triple-equals
      } else if (this.compare(operator, prospect[field], expectedValue)) {
        return this.pass(this.operatorSuccessMessages[operator.replace(/\s/g, '').toLowerCase()], [
          field,
          expectedValue,
        ]);
      }

      return this.fail(this.operatorFailMessages[operator.replace(/\s/g, '').toLowerCase()], [
        field,
        expectedValue,
        prospect[field],
      ]);
    } catch (e) {
      return this.error('There was a problem creating the Prospect: %s', [e.toString()]);
    }
  }

}

export { ProspectFieldEquals as Step };
