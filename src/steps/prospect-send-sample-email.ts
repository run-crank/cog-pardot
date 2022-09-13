import { BaseStep, ExpectedRecord, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../proto/cog_pb';

export class ProspectSendSampleEmailStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Send Pardot Prospect Sample Email';
  protected stepExpression: string = 'send a sample email to pardot prospect (?<emailAddress>.+\@.+\..+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'The ID of the Pardot campaign to associate the email with',
  }, {
    field: 'emailTemplateId',
    type: FieldDefinition.Type.STRING,
    description: 'The Pardot ID of the email template',
  }, {
    field: 'toEmail',
    type: FieldDefinition.Type.EMAIL,
    description: 'The email address of the prospect you\'re sending the email to',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'email',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Email's Pardot ID",
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: "Email's Name",
    }, {
      field: 'subject',
      type: FieldDefinition.Type.STRING,
      description: 'Email\'s Subject',
    }, {
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'Email\'s Message',
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date/time the Email was created',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const campaignId: any = stepData.campaignId;
    const emailTemplateId: any = stepData.emailTemplateId;
    const toEmail: string = stepData.toEmail;
    const buidName: string = stepData.businessUnitName;

    try {
      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }
      const response = await this.client.sendSampleEmail(campaignId, emailTemplateId, toEmail, buid);
      if (response.err) {
        return this.error('There was an error sending the Pardot email with id %d: %s', [emailTemplateId, JSON.stringify(response.err)]);
      }

      // replace the message object to the message text instead
      response.email.message = response.email.message.text;
      const records = this.createRecords(response.email, stepData['__stepOrder']);
      return this.pass('Successfully sent Pardot email with id %d to %s', [emailTemplateId, toEmail], records);
    } catch (e) {
      if (e.response.data) {
        return this.error('There was an error sending the Pardot email with id %d: %s', [emailTemplateId, JSON.stringify(e.response.data)]);
      }

      return this.error('There was an error sending the Pardot email with id %d: %s', [emailTemplateId, JSON.stringify(e)]);
    }
  }

  public createRecords(email, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('email', 'Sent Email', email));
    // Ordered Record
    records.push(this.keyValue(`email.${stepOrder}`, `Sent Email from Step ${stepOrder}`, email));
    return records;
  }

}

export { ProspectSendSampleEmailStep as Step };
