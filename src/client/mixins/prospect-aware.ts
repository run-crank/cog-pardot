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

    const prospect: any = await this.readByEmail(email);

    return new Promise((resolve, reject) => {
      this.client.prospects.deleteById(prospect.id).then(resolve).fail(reject);
    });
  }

  public async readByEmail(email: string) {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      this.client.prospects.readByEmail(email).then((response) => {
        const prospects = response.prospect;

        if (Array.isArray(prospects)) {
          resolve(prospects.sort(
            (a, b) => new Date(a['created_at']) < new Date(b['created_at']) ? 1 : -1)[0]);
        } else {
          resolve(prospects);
        }

      }).fail(reject);
    });
  }
}
