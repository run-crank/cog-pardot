export class ListMembershipAware {
  public client: any;
  public clientReady: Promise<boolean>;
  public retry: any;

  public attempt: (fn: () => Promise<any>, retryCount?: number) => Promise<any>;

  async readByListIdAndProspectId(listId, prospectId) {
    await this.clientReady;
    return this.attempt(() => {
      return new Promise((resolve, reject) => {
        this.client.listMemberships.readByListIdAndProspectId(listId, prospectId).then(resolve).catch(reject);
      });
    });
  }

}
