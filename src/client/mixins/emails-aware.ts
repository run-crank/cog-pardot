export class EmailsAwareMixin {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public pardotUrl: any;
  public host: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  public async sendSampleEmail(campaignId: string, emailTemplateId: string, prospectEmail: string, businessUnitId: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.post(`https://${this.pardotUrl}/api/email/version/4/do/send/prospect_email/${prospectEmail}?campaign_id=${+campaignId}&email_template_id=${+emailTemplateId}&format=json`, 
        {}, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': businessUnitId,
          },
        }).then((response) => {
          resolve(response.data);
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

  public async getEmail(emailId: string, businessUnitId: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.get(`https://${this.pardotUrl}/api/email/version/4/do/read/id/${emailId}&format=json`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': businessUnitId,
          },
        }).then((response) => {
          resolve(response.data);
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }
}
