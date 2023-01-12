/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class ListMembershipCount extends BaseStep implements StepInterface {

  protected stepName: string = 'Count a Pardot list membership';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'check the number of members from pardot list (?<listName>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'List Membership Count';
  protected expectedFields: Field[] = [{
    field: 'businessUnitName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of Business Unit',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'listName',
    type: FieldDefinition.Type.STRING,
    description: 'Name of the List',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'listMember',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'listId',
      type: FieldDefinition.Type.STRING,
      description: "Static List's Marketo ID",
    }, {
      field: 'listMemberCount',
      type: FieldDefinition.Type.STRING,
      description: "Static List's Member Count",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const listName = stepData.listName;
    const buidName = stepData.businessUnitName;

    try {
      let buid: string;
      if (!buidName || buidName == 'Default') {
        buid = this.client.businessUnitId;
      } else {
        buid = this.client.additionalBusinessUnits[buidName];
      }
      // Check if list exists and also get the id
      const list: any = await this.client.getListByName(listName, buid, ['id']);
      if (!list || (list && list.values.length === 0)) {
        return this.error('List with name %s does not exist', [
          listName,
        ]);
      }

      const data = await this.client.getProspectsByListId(list.values[0].id, buid);
      const record = this.createRecord(list.values[0].id, data.total_results);
      const orderedRecord = this.createOrderedRecord(list.values[0].id, data.total_results, stepData['__stepOrder']);
      return this.pass('List %s has %s members', [listName, data.total_results], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was an error while checking list member count: %s', [e.message]);
    }
  }

  createRecord(listId: string, count: number) {
    const record = {
      listId,
      listMemberCount: count,
    };
    return this.keyValue('listMember', 'Checked Static List Member Count', record);
  }

  createTable(listMember: Record<string, any>[]) {
    const headers = {};
    const headerKeys = Object.keys(listMember[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    return this.table('listMemberList', 'Checked List Member', headers, listMember);
  }

  createOrderedRecord(listId: string, count: number, stepOrder = 1) {
    const record = {
      listId,
      listMemberCount: count,
    };
    return this.keyValue(`listMember.${stepOrder}`, `Checked List Member Count from Step ${stepOrder}`, record);
  }
}

export { ListMembershipCount as Step };
