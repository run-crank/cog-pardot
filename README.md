# Pardot Cog

[![CircleCI](https://circleci.com/gh/run-crank/cog-pardot/tree/master.svg?style=svg)](https://circleci.com/gh/run-crank/cog-pardot/tree/master)

This is a [Crank][what-is-crank] Cog for Pardot, providing
steps and assertions for you to validate the state and behavior of your
Pardot instance.

* [Installation](#installation)
* [Usage](#usage)
* [Development and Contributing](#development-and-contributing)

## Installation

Ensure you have the `crank` CLI and `docker` installed and running locally,
then run the following.  You'll be prompted to enter your Pardot
credentials once the Cog is successfully installed.

```shell-session
$ crank cog:install stackmoxie/pardot
```

Note: You can always re-authenticate later.

## Usage

### Authentication
<!-- run `crank cog:readme stackmoxie/pardot` to update -->
<!-- authenticationDetails -->
You will be asked for the following authentication details on installation. To avoid prompts in a CI/CD context, you can provide the same details as environment variables.

| Field | Install-Time Environment Variable | Description |
| --- | --- | --- |
| **email** | `CRANK_AUTOMATONINC_PARDOT__EMAIL` | Email address |
| **password** | `CRANK_AUTOMATONINC_PARDOT__PASSWORD` | Password |
| **userKey** | `CRANK_AUTOMATONINC_PARDOT__USERKEY` | User key |

```shell-session
# Re-authenticate by running this
$ crank cog:auth stackmoxie/pardot
```
<!-- authenticationDetailsEnd -->

API user keys are available in Pardot under `{your email address}` > Settings
in the API User Key row. In accounts with Salesforce User Sync enabled,
you must authenticate with a Pardot-only user. SSO users aren't supported.

### Steps
Once installed, the following steps will be available for use in any of your
Scenario files.

<!-- run `crank cog:readme stackmoxie/pardot` to update -->
<!-- stepDetails -->
| Name (ID) | Expression | Expected Data |
| --- | --- | --- |
| **Check Pardot List Membership**<br>(`CheckListMembership`) | `the (?<email>.+) pardot prospect should (?<optInOut>be opted in to\|be opted out of\|not be a member of) list (?<listId>.+)` | - `email`: The Email Address of the Prospect <br><br>- `optInOut`: One of "be opted in to", "be opted out of", or "not be a member of" <br><br>- `listId`: The ID of the Pardot List |
| **Create a Pardot Prospect**<br>(`CreateProspect`) | `create a pardot prospect` | - `prospect`: A map of field names to field values |
| **Delete a Pardot Prospect**<br>(`DeleteProspect`) | `delete the (?<email>.+) pardot prospect` | - `email`: Email address |
| **Check a field on a Pardot Prospect**<br>(`ProspectFieldEquals`) | `the (?<field>[a-zA-Z0-9_]+) field on pardot prospect (?<email>.+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `email`: Prospect's email address <br><br>- `field`: Field name to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: Expected field value |
<!-- stepDetailsEnd -->

## Development and Contributing
Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change. Please make sure to add or update tests
as appropriate.

### Setup

1. Install node.js (v12.x+ recommended)
2. Clone this repository.
3. Install dependencies via `npm install`
4. Run `npm start` to validate the Cog works locally (`ctrl+c` to kill it)
5. Run `crank cog:install --source=local --local-start-command="npm start"` to
   register your local instance of this Cog. You may need to append a `--force`
   flag or run `crank cog:uninstall stackmoxie/pardot` if you've already
   installed the distributed version of this Cog.

### Adding/Modifying Steps
Modify code in `src/steps` and validate your changes by running
`crank cog:step stackmoxie/pardot` and selecting your step.

To add new steps, create new step classes in `src/steps`. Use existing steps as
a starting point for your new step(s). Note that you will need to run
`crank registry:rebuild` in order for your new steps to be recognized.

Always add tests for your steps in the `test/steps` folder. Use existing tests
as a guide.

### Modifying the API Client or Authentication Details
Modify the ClientWrapper class at `src/client/client-wrapper.ts`.

- If you need to add or modify authentication details, see the
  `expectedAuthFields` static property.
- If you need to expose additional logic from the wrapped API client, add a new
  ublic method to the wrapper class, which can then be called in any step.
- It's also possible to swap out the wrapped API client completely. You should
  only have to modify code within this clase to achieve that.

Note that you will need to run `crank registry:rebuild` in order for any
changes to authentication fields to be reflected. Afterward, you can
re-authenticate this Cog by running `crank cog:auth stackmoxie/pardot`

### Tests and Housekeeping
Tests can be found in the `test` directory and run like this: `npm test`.
Ensure your code meets standards by running `npm run lint`.

[what-is-crank]: https://crank.run?utm_medium=readme&utm_source=automatoninc%2Fpardot
