# saas-boilerplate

## 0 Todo

- [ ] script for db syncing
- [ ] update take screenshots file
- [ ] update mantine to v8

## 1.0 setup

Do 1.1 and 1.2, then after just do 1.3 every time you come to the project.

### 1.1 Configure project

1.1 make a colour palette here: <https://www.tints.dev/brand/800000>

- value: 800000
- recommend these lightness values:
	- maximum: 50
	- minimum: 10

1.2 Copy .env.example to .env and fill in most values

1.3 Optional: Define a local host name in `/etc/hosts` for the project, then add it to both `.env.development` and `vite.config.js` in the `server.allowedHosts` array.

1.4 Optional: If you plan to receive external (to the host) events, run ngrok and put the url it gives into `vite.config.js` `server.allowedHosts` too.

1.5: Manually edit the `app/server/src/emails/baseTemplate.mjml` email template file (it doesn't read env vars). Update these things:
- colours
- Footer brand (app name)

1.6: Add a postgres database on digital ocean, and then dump the connection string (with db name) into the env file.

1.7 Similarly, create staging/production database.

1.8 Seed an admin user (requires you set email/pass in env file): `docker-compose run app sh -c "cd server && yarn --silent && cd ../server && yarn --silent"`

1.9 Update the repo name in github actions `.github/workflows/main.yml` so that it puts the build to github container registry with a relevant name.

1.10 Then update the container name in `docker-compose.dokploy.staging.yml` to match. Likewise `docker-compose.dokploy.production.yml`.

1.11 Update `[todo: app name]` in `app/client/index.html`, and add analytics

1.12 Update `[todo: app name]` in `app/client/vite.config.ts`

1.13 Update `[todo: app name]` in `app/client/src/components/Header.tsx`

1.14 Update `app/client/src/layouts/MainLayout.tsx` to add a support email

## 1.2 build

Build the app: `docker-compose build app`

install deps: `docker-compose run app sh -c "cd client && yarn --silent && cd ../server && yarn --silent"`

## 1.3 dev

`docker-compose up app` in one terminal to get the app running (it will auto restart as you work on the client/server).
Seperately have a terminal `docker-comose run app sh` from where you can cd into client or server, to install yarn deps.

1.3.1 Migrations

In development, edit the `app/server/prisma/schema.prisma` schema file. Then run from the server dir within the app container (`docker-comose run app sh && cd server`) the migrate script: `yarn run migrate-dev`. It will prompt you for a description / migration name.

In prod all migrations happen automatically during deployment.



## deployment

- pushing to master, github action then runs which ends by merging to a staging branch which render will auto deploy

To run scripts in the dokploy container, after accessing their via terminal. Env vars must be reloaded before accessing in a script. eg:

```
/app/server # set -a && . ../client/.env && set +a
/app/server # yarn run seed:admin
```

## testing

to test locally `docker-compose -f docker-compose.testing.yml up` and then in another console `docker-compose -f docker-compose.testing.yml run app sh` and then `cd server && yarn run test`, or `yarn run test-specific` and edit the server package file to mention the test name.

run all test in one command:
`docker-compose -f docker-compose.testing.yml up -d && docker-compose -f docker-compose.testing.yml run app sh -c "cd server && yarn run test"`

simulate ci:
`docker-compose -f docker-compose.ci.yml up -d && docker-compose -f docker-compose.ci.yml run app sh -c "yarn run test"`

## database sync

Run this command in dir root, outwith a container - but after starting the app (so that the local postgrse is running): `bash ./sync-db.sh`
It requires that the local `.env.production` is populated with a prod db connection string for postgres (and it assumes the host as hardcoded in the file...).

## marketing

when the app is running locally, bash into server and run `yarn run screenshot` to get screenshots.

## github

- make an `.env.staging.dokploy` and put it into a repo secret for actions `ENV_DOKPLOY_STAGING`.
- generate a new token with repo read access and package write access, add it as a repo secret as `CI_GITHUB_ACTOR`
- give the repo access to the registry:
	- eg samthomson/saas-boilerplate/settings/actions
	- Workflow permissions
		- [x] Read and write permissions

## db

- make a new database on digital ocean, and add the name to the env file for dokploy.
