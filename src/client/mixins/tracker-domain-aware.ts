export class TrackerDomainAwareMixin {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public pardotUrl: any;
  public host: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  public async getTrackerDomainById(id: string, fields: string[], businessUnitId: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {

        this.client.get(`https://${this.pardotUrl}/api/v5/objects/tracker-domains/${id}?fields=${fields.join(',')}`, {
          headers: {
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': businessUnitId,
          },
        }).then((response) => {
          resolve(response.data);
        }).catch((e) => {
          reject(e);
        });
      });
    });
  }
}
