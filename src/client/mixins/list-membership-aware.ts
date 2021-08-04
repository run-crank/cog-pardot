import { groupCollapsed } from 'console';

export class ListMembershipAware {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public host: any;
  public businessUnitId: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  async readByListIdAndProspectId(listId, prospectId) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.get(`/api/listMembership/version/4/do/read/list_id/${listId}/prospect_id/${prospectId}`, {
          headers: {
            'Host': this.host,
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
        }).then(resolve).catch(reject);
      });
    });
  }

}
