import * as Pardot from '../pardot-wrapper';

export class ProspectAwareMixin {
  public client: Pardot.PardotClient;
  public clientReady: Promise<boolean>;
  public retry: any;

  public attempt: (fn: (...params) => Promise<any>, retryCount: number, ...params) => Promise<any>;

  public async createProspect(prospect: Record<string, any>) {
    await this.clientReady;
    return this.attempt(this.client.prospects.create, 1, prospect.email, prospect);
  }

  public async deleteProspectByEmail(email: string) {
    await this.clientReady;
    const prospect: any = await this.readByEmail(email);
    return this.attempt(this.client.prospects.deleteById, 1, prospect.id);
  }

  public async readByEmail(email: string) {
    await this.clientReady;
    return this.attempt(this.client.prospects.readByEmail, 1, email);
  }
}
