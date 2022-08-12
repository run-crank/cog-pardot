import { groupCollapsed } from 'console';

export class ListAware {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public pardotUrl: any;
  public host: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  async getListByName(listName, businessUnitId, fields) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.get(`https://${this.pardotUrl}/api/v5/objects/lists?fields=${fields.join(',')}&name=${listName}`, {
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
