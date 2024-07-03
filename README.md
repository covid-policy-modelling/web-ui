# COVID Modelling Web UI

This is a [Next.js][nextjs] application that serves the GitHub COVID modelling web interface.

The needs of the unified modelling project are changing rapidly, and so we do not have a set-in-stone development roadmap.
This application is built with the goal of it hopefully being not too difficult to alter or even rewrite parts of it as requirements change.

To learn more about this project's goals, please see [PROJECT-INTENT.md](PROJECT-INTENT.md).

## Configuration for Local Development

This app has two development modes: "local" and "advanced" mode.
The "local" mode is a much easier development setup, but does not actually queue simulation runs with the development control plane.
Instead, it uses a stubbed result.
The "advanced" mode is for maintainers only—it requires access to some shared credentials and accounts.

### Requirements

1. [Docker][docker] (v19.03).
   - This repository assumes that your [user has been configured to manage Docker](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).
   - **_NOTE_**: This does not work out of the box with [colima](https://github.com/abiosoft/colima). Additional configuration may be required.
1. [Docker Compose][docker-compose] (v1.22).
1. Node.js (v14.15) / npm (v6.14), either installed [directly][npm] or using [nvm][nvm].

Versions listed have been confirmed to work, but older/newer versions may (or may not) also work.

### Shared Setup (for both local and advanced modes)

1. Start [Docker][docker].
1. Clone this repository:

   ```shell
   > git clone https://github.com/covid-policy-modelling/web-ui
   > cd web-ui
   ```

1. Install dependencies:

   ```shell
   > npm install
   ```

### Local Mode Setup

1. Create an OAuth app for local development:

   - Go to <https://github.com/settings/applications/new> to create a new OAuth app
   - In the _Authorization callback URL_ section, fill in `http://localhost:3000/api/callback`
   - Fill in anything you want for _Application name_ and _Homepage URL_ (this is for personal use only)
   - Click _Register application_
   - Click _Generate a new client secret_
   - Make a note of the **_Client ID_** and **_Client Secret_**, you will need them for the next step (and you will not be able to retrieve the client secret later).

1. Run the environment setup script:

   ```shell
   > script/setup
   ```

   This script will ask you a series of questions — you'll want to answer that yes, you do want to run in local mode.
   When asked, enter the _Client ID_ and _Client Secret_ from the previous step.
   Although the script does not say this, for other questions, you can press _Enter_ to select a default value, which is usually appropriate.
   The resulting configuration will be written into a `.env` file in the same directory.

1. Setup the database:

   ```shell
   > script/db-create
   ```

   Optionally, run all the database migrations (these will be automatically run every time you start the server).

   ```shell
   > script/db-migrate up
   ```

   Optionally, if you want to start a `mysql` client on the database you can run:

   ```
   > script/db-console
   ```

1. Start the server:

   ```shell
   > script/server
   ```

1. Fetch case data:
   This script requires some environment variables (see `script/fetch-recorded-data --help`, you will get most of the values for the environment variables from the `.env` file - the database name is `github_covid_modelling_dev`), but if you've already got your `.env` set up, you can run the script with [foreman][foreman] to avoid manually setting them:

```shell
   > npx foreman run script/fetch-recorded-data
```

6. Authorize your local user to log in:

```shell
> script/authorize-local-user $my_github_username
```

7. Go to your browser to view the interface at `http://localhost:3000`.

### Advanced Mode Setup (Maintainers Only)

Advanced mode requires a number of secrets documented in [env.yml](env.yml), whose development values can be accessed by following instructions in the private [maintainers-only documentation][maintainer-docs].

1. Start an HTTP [ngrok proxy][ngrok] pointing to port 3000 and note its URL (such as "https://e028f3f1.ngrok.io"):

   ```shell
   > script/tunnel
   ```

   _Note_: If you don't want to install ngrok locally, you can instead run `script/tunnel-docker`, then visit "http://localhost:46000" to see the proxy URL

1. Get the OAuth development app (not created yet) client ID and secret. You'll be prompted for them in the next step.

1. Run the environment setup script:

   ```shell
   > script/setup
   ```

   This script will ask you a series of questions — you'll want to answer that no, you don't want to run in local mode.

   This script will now ask for a number of environment variables, each of which can be accessed by following instructions in the [maintainer docs][maintainer-docs].

   It'll also ask you for a `RUNNER_CALLBACK_URL`, which should be the value of your ngrok proxy.

1. Start the server:

   ```shell
   > script/server
   ```

1. Fetch case data:

   This script requires some environment variables (see `script/fetch-recorded-data --help`), but if you've already got your .env set up, you can run the script with [foreman][foreman] to avoid manually setting them:

   ```shell
   > npx foreman run script/fetch-recorded-data
   ```

1. Authorize your local user to log in:

   ```shell
   > script/authorize-local-user $my_github_username
   ```

### Production Mode (Remote database)

For testing purposes, you may wish to run the environment in production mode, and connect to a database on Azure.
To do so, you can mostly follow the instructions for _Advanced mode_, with the following caveats:

- Use the connection details of your remote database
- For Azure (and possibly others), the DB username has to be of the form: username@host
- You cannot run the `script/db-*` scripts, but you don't need to anyway
  - The database is created as part of the infrastructure setup
  - The database is migrated when you start the server using the below command
- To run the server, you need to first run `export COMPOSE_FILE=docker-compose.release.yml` before running `script/server`
- You cannot run `script-fetch-recorded-data` directly, you instead need to do it on the container: `docker compose exec --env NODE_ENV=production web npx foreman run script/fetch-recorded-data`
- You cannot currently use the script/authorize-local-user script, you instead need to connect to the database and add entries manually

### Manual Configuration

Configuration can also be carried out by directly editing the `.env` file.
The environment variables are documented in [env.yml](env.yml).

## Common Development Tasks

### Configuring models

The file `models.yml` contains metadata specifying which model connectors are used when carrying out simulations.
This file is in source control, and should be kept up-to-date with information on each model, with values that are appropriate as a default for development purposes.

- All model connectors should be included in here (even if not all deployments use them)
- The information (description, links etc.) should be as useful to a general audience as possible
- `enabled` should be set to `true` if the connector image is publicly available, and `false` otherwise
- `imageURL` should be set to install the `latest` (or similar) version of each image

Do not edit this file in order to tailor your specific deployment.
Instead, you can provide a file called `.override/models.yml` in the same format, and the two files will be merged together.
This file should not be checked into source control.
For example, this can be used to:

#### Disable models you do not need to use

```
basel:
  enabled: false
```

#### Enable private connectors (assuming you have set up appropriate credentials)

```
covasim:
  enabled: true
```

#### Pin specific versions of models for a production deployment

```
mrc-ide-covid-sim:
  imageURL: ghcr.io/covid-policy-modelling/covid-sim-connector/covid-sim-connector:1.10.0
```

#### Other changes

You can override any of the properties from `models.yml`, not just the ones mentioned above.
You do not need to provide values for any properties that you are not interested in changing.
Please note however that the merging of files is quite simple - any properties specified in `.override/models.yml` completely replace those in `models.yml`.

As an example, consider adding a new region (`UK`) to the list of supported regions for a model, where `models.yml` contains the following:

```
my-model:
  name: My Model
  ...
  supportedRegions:
    US:
      - US-AL
      - US-AK
```

Your `.override/models.yml` needs to contain:

```
my-model:
  supportedRegions:
    US:
      - US-AL
      - US-AK
    UK: []
```

The following would _not_ work, and would effectively remove the US regions:

```
my-model:
  supportedRegions:
    UK: []
```

### Testing

Tests can be executed by running `npm test`.
Tests will be executed automatically by GitHub actions when commits are made.
Note that the test suite is quite minimal at present.

### Data testing

There are some additional scripts for testing the `fetch-recorded-data` script.
These aren't fully automated as they have external dependencies.
See `verification/README.md` for instructions.

### API Testing

The API can be tested be running `script/test-api`.
This uses the example [Python API client](https://github.com/covid-policy-modelling/api-client-examples/tree/main/python) to execute a set of API commands and display the output.
Before running the tests, you must obtain an API token, and place it in a file named `.env.test` with the contents:

```
API_TOKEN=eyJ...
```

### Database Migrations

In development, database migrations are run automatically when the web container starts.
In staging/production, migrations are run manually via a GitHub Action.

To create a database migration:

```shell
# Create a migration
> script/db-migrate create name-of-migration --sql-file
```

We pass the `--sql-file` here because we write migrations in plain SQL in this project.

### Updating Case Data and Intervention Data

The `case_data` and `intervention_data` tables are populated by the `fetch-recorded-data` script.
This must be run manually for local development.
This is run nightly via a GitHub Action on staging and production.

### API Documentation

The API documentation must be updated manually if routes/types are changed.
This can be done with `script/generate-docs`.

### Publishing (maintainers only)

GitHub Actions will build, test, and publish whenever changes are committed to this repository.

To build and publish a numbered version of a package, run `npm version [major | minor | patch]`, then run `git push --tags`.

## Architecture

- Pages are in `pages/{route}.tsx`.
- Components are in `components/{Component}.tsx`.
- API functions are in `pages/api/{route}.tsx`.

### Useful Documentation

- [Next.js pages](https://nextjs.org/docs/basic-features/pages)
- [Next.js API routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel serverless functions](https://zeit.co/docs/v2/serverless-functions/introduction)
- [Vercel environment variables and secrets](https://zeit.co/docs/v2/serverless-functions/env-and-secrets)
- [React documentation](https://reactjs.org/docs/getting-started.html)

## Contributing

We welcome contributions to this project from the community.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE).

[docker]: https://www.docker.com/get-started
[docker-compose]: https://docs.docker.com/compose/
[dpx]: https://npm.im/dpx
[foreman]: https://npm.im/foreman
[maintainer-docs]: https://github.com/covid-policy-modelling/infrastructure
[nextjs]: https://nextjs.org
[ngrok]: https://ngrok.com/
[npm]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[nvm]: https://github.com/nvm-sh/nvm
[staging]: https://covid-modelling-stg.epcc.ed.ac.uk/
