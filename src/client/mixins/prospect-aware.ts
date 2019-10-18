import * as pardot from 'lew-pardot';

export class ProspectAwareMixin {
  public client: pardot;
  public clientReady: Promise<boolean>;

  public async createProspect(prospect: Record<string, any>) {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.prospects.create(prospect.email, prospect).then(resolve).fail(reject);
    });
  }

  public async deleteProspectByEmail(email: string) {
    await this.clientReady;

    const prospects: any = await this.readByEmail(email);

    let prospectId;

    if (Array.isArray(prospects.prospect)) {
      prospectId = prospects.prospect.map(f => f.id)[0];
    } else {
      prospectId = prospects.prospect.id;
    }

    return new Promise((resolve, reject) => {
      this.client.prospects.deleteById(prospectId).then(resolve).fail(reject);
    });
  }

  public async readByEmail(email: string) {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      this.client.prospects.readByEmail(email).then(resolve).fail(reject);
    });
  }
}
