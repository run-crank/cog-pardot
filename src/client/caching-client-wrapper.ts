import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}${this.idMap.connectionId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Prospect Aware
  public async createProspect(prospect: Record<string, any>, businessUnitId: string) {
    await this.clearCache();
    return await this.client.createProspect(prospect, businessUnitId);
  }

  public async deleteProspectByEmail(email: string, businessUnitId: string) {
    await this.clearCache();
    return await this.client.deleteProspectByEmail(email, businessUnitId);
  }

  public async getProspectsByListId(listId: string, businessUnitId: string) {
    const cachekey = `Pardot|Prospect|${listId}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getProspectsByListId(listId, businessUnitId);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async getProspectByEmail(email: string, businessUnitId: string) {
    const cachekey = `Pardot|Prospect|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getProspectByEmail(email, businessUnitId);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  // Tracker Domain Aware
  public async getTrackerDomainById(id: string, fields: string[], businessUnitId: string) {
    await this.clearCache();
    return await this.client.getTrackerDomainById(id, fields, businessUnitId);
  }

  // List Membership Aware
  async getListMembershipByListIdAndProspectId(listId, prospectId, businessUnitId) {
    await this.clearCache();
    return await this.client.getListMembershipByListIdAndProspectId(listId, prospectId, businessUnitId);
  }

  async getListMembershipsByListId(listId, businessUnitId, fields, nextPageToken = null) {
    await this.clearCache();
    return await this.client.getListMembershipsByListId(listId, businessUnitId, fields, nextPageToken);
  }

  // List Aware
  async getListByName(listName, businessUnitId, fields) {
    await this.clearCache();
    return await this.client.getListByName(listName, businessUnitId, fields);
  }

  // Email Aware
  public async sendSampleEmail(campaignId: string, emailTemplateId: string, prospectEmail: string, businessUnitId: string) {
    await this.clearCache();
    return await this.client.sendSampleEmail(campaignId, emailTemplateId, prospectEmail, businessUnitId);
  }

  public async getEmail(emailId: string, businessUnitId: string) {
    await this.clearCache();
    return await this.client.getEmail(emailId, businessUnitId);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}
​
export { CachingClientWrapper as CachingClientWrapper };
