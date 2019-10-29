import * as pardot from 'lew-pardot';

export class Pardot {

  public auth(email: string, password: string, userKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pardot({
        email, password, userKey,
      }).then((client: any) => {
        resolve(new PardotClient(client));
      }).fail((err: Error) => {
        if (err['code'] === 15) {
          reject('Login failed. Please check your auth credentials and try again.');
        } else if (err['code'] === 122) {
          reject('API call limit reached for today.');
        }

        reject(err);
      });
    });
  }
}

export class PardotClient {
  constructor(private client: any) {}

  public prospects = {
    create: (email, prospect) =>
       new Promise((resolve, reject) =>
       this.client.prospects.create(email, prospect).then(resolve).fail(reject),
     ),
    deleteById: id =>
       new Promise((resolve, reject) =>
       this.client.prospects.deleteById(id).then(resolve).fail(reject),
    ),
    readByEmail: (email) => {
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
    },
  };
}
