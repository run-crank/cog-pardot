import * as Pardot from '../pardot-wrapper';

export class ProspectAwareMixin {
  public client: Pardot.PardotClient;
  public clientReady: Promise<boolean>;
  public retry: any;

  public attempt: (promise: Promise<any>, attemptCount?: number) => Promise<any>;

  public async createProspect(prospect: Record<string, any>) {
    await this.clientReady;
    return this.attempt(this.client.prospects.create(prospect.email, prospect), 5);
  }

  public async deleteProspectByEmail(email: string) {
    await this.clientReady;
    const prospect: any = await this.readByEmail(email);
    return this.attempt(this.client.prospects.deleteById(prospect.id));
  }

  public async readByEmail(email: string) {
    await this.clientReady;
    return this.attempt(this.client.prospects.readByEmail(email));
  }
}
