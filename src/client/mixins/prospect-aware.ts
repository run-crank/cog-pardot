export class ProspectAwareMixin {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public pardotUrl: any;
  public host: any;
  public businessUnitId: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  public async createProspect(prospect: Record<string, any>) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.post(
          `https://${this.pardotUrl}/api/prospect/version/4/do/create?format=json`,
          {},
          {
            headers: {
              'Authorization': this.accessToken,
              'Pardot-Business-Unit-Id': this.businessUnitId,
            },
            params: {
              ...prospect,
              email: prospect.email,
            },
          }).then((res) => {
            resolve(res.data);
          }).catch(reject);
      });
    });
  }

  public async deleteProspectByEmail(email: string) {
    await this.clientReady;
    const prospect: any = await this.readByEmail(email);
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.delete(`https://${this.pardotUrl}/api/prospect/version/4/do/delete/id/${prospect.id}?format=json`, {
          headers: {
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
        }).then((res) => {
          resolve(res.data);
        }).catch(reject);
      });
    });
  }

  public async readByEmail(email: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {

        this.client.get(`https://${this.pardotUrl}/api/prospect/version/4/do/read/email/${email}?format=json`, {
          headers: {
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
        }).then((response) => {
          const prospects = response.data.prospect;

          if (Array.isArray(prospects)) {
            resolve(prospects.sort(
              (a, b) => new Date(a['created_at']) < new Date(b['created_at']) ? 1 : -1)[0]);
          } else {
            resolve(prospects);
          }

        }).catch(reject);
      });
    });
  }
}
