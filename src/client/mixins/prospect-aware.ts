export class ProspectAwareMixin {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;
  public accessToken: any;
  public host: any;
  public businessUnitId: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  public async createProspect(prospect: Record<string, any>) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.post('/api/prospect/version/4/do/create', {
          headers: {
            'Host': this.host,
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
          params: {
            email: prospect.email,
            prospect: { prospect },
          },
        }).then(resolve).catch(reject);
      });
    });
  }

  public async deleteProspectByEmail(email: string) {
    await this.clientReady;
    const prospect: any = await this.readByEmail(email);
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.delete(`/api/prospect/version/4/do/delete/email/${email}`, {
          headers: {
            'Host': this.host,
            'Authorization': this.accessToken,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
        }).then(resolve).catch(reject);
      });
    });
  }

  public async readByEmail(email: string) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {

        this.client.get(`/api/prospect/version/4/do/read/email/${email}`, {
          headers: {
            'Host': this.host,
            'Authorization': this.access_token,
            'Pardot-Business-Unit-Id': this.businessUnitId,
          },
        }).then((response) => {
          const prospects = response.prospect;

          if (Array.isArray(prospects)) {
            resolve(prospects.sort(
              (a, b) => new Date(a['created_at']) < new Date(b['created_at']) ? 1 : -1)[0]);
          } else {
            resolve(prospects);
          }

        }).fail(reject);
      });
    });
  }
}
