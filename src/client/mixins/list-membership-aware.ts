import { groupCollapsed } from 'console';

export class ListMembershipAware {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public pardotUrl: any;
  public host: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  async readByListIdAndProspectId(listId, prospectId, businessUnitId: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.get(`https://${this.pardotUrl}/api/listMembership/version/4/do/read/list_id/${listId}/prospect_id/${prospectId}?format=json`, {
          headers: {
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': businessUnitId,
          },
        }).then((res) => {
          resolve(res.data);
        }).catch(reject);
      });
    });
  }

}
