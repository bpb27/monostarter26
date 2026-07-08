Scaffold out a monorepo.

Mobile app, user web app, admin web app, server.

Tooling:
- Turborepo
- PNPM
- Expo
- Vite+
- Postgres
- Kysely
- Vercel
- Mise

First I'd like to check the Vercel and Expo docs for up-to-date info.
User and admin web apps should be React Vite SPAs w/ React Router.
Server should be NodeJS, but I haven't decided on a framework yet.
Everything should be in Typescript.
Leaning toward Postgres via Superbase via Vercel.
Vite+ for linting, formatting, FE compilation, and testing.
Leaning toward Docker.
Leaning toward Clerk of Auth0 for auth (also via Vercel if that's an option).
