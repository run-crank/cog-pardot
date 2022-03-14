import { BaseStep, ExpectedRecord, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CheckListMembership extends BaseStep implements StepInterface {

  protected stepName: string = 'Check Pardot List Membership';
  protected stepExpression: string = 'the (?<email>.+) pardot prospect should (?<optInOut>be opted in to|be opted out of|not be a member of) list (?<listId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'The Email Address of the Prospect',
  }, {
    field: 'optInOut',
    type: FieldDefinition.Type.STRING,
    description: 'One of "be opted in to", "be opted out of", or "not be a member of"',
  }, {
    field: 'listId',
    type: FieldDefinition.Type.NUMERIC,
    description: 'The ID of the Pardot List',
  }, {
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit to use',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'listMembership',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "List Membership's Pardot ID",
    }, {
      field: 'list_id',
      type: FieldDefinition.Type.NUMERIC,
      description: "List's Pardot ID",
    }, {
      field: 'prospect_id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Prospect's Pardot ID",
    }, {
      field: 'opted_out',
      type: FieldDefinition.Type.BOOLEAN,
      description: 'Opted Out',
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date created',
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: 'The date updated',
    }],
    dynamicFields: false,
  }, {
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
    const email = stepData.email;
    const optInOut = stepData.optInOut;
    const listId = stepData.listId;
    const buidName: string = stepData.businessUnitName;
    let listMembershipRecord;
    let prospectRecord;
    let listMembership;

    try {
      // Get the actual Business Unit ID to use, based on the provided name
      let buid: string;
      if (!buidName || buidName == 'default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }
      const prospect = await this.client.readByEmail(email, buid);
      prospectRecord = this.keyValue('prospect', 'Checked Prospect', prospect);
      listMembership = (await this.client.readByListIdAndProspectId(listId, prospect.id, buid)).list_membership;
    } catch (e) {
      //// This means that the List ID provided does not exist
      if (e?.response?.data?.err === 'Invalid ID') {
        if (optInOut === 'not be a member of') {
          return this.pass(
            'Prospect %s is not a member of %d, as expected.',
            [email, listId],
            [prospectRecord],
          );
        }

        return this.fail('No list found with ID %d', [listId], [prospectRecord]);
      } else if (e?.response?.data?.err === 'Invalid prospect email address') {
        return this.fail('No prospect found with email %s', [email]);
      }

      return this.error('There was a problem checking list membership: %s', [e.toString()]);
    }

    listMembershipRecord = this.keyValue('listMembership', 'List Membership', listMembership);

    if (optInOut === 'not be a member of') {
      return this.fail(
        'Expected prospect %s to not be a member of list %d, but a list membership was found',
        [email, listId],
        [prospectRecord, listMembershipRecord],
      );
    }

    if (optInOut === 'be opted in to') {
      if (listMembership.opted_out) {
        return this.fail(
          'Expected prospect %s to be opted in to list %d, but the prospect is opted out.',
          [email, listId],
          [prospectRecord, listMembershipRecord],
        );
      } else {
        return this.pass(
          'Prospect %s is opted in to list %s, as expected.',
          [email, listId],
          [prospectRecord, listMembershipRecord],
        );
      }
    } else if (optInOut === 'be opted out of') {
      if (listMembership.opted_out) {
        return this.pass(
          'Prospect %s is opted out of list %s, as expected.',
          [email, listId],
          [prospectRecord, listMembershipRecord],
        );
      } else {
        return this.fail(
          'Expected prospect %s to be opted out of list %d, but the prospect is opted in.',
          [email, listId],
          [prospectRecord, listMembershipRecord],
        );
      }
    }
  }
}

export { CheckListMembership as Step };
