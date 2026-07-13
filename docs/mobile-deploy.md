# Mobile deployment (EAS)

Mobile ships via **[EAS](https://docs.expo.dev/eas/)**, not Railway (there's no
server process to containerize). Two independent mechanisms:

- **EAS Build** — produces native binaries (`.ipa` / `.apk`/`.aab`). Needed for
  any native change: SDK bump, a new native module, or a config-plugin change.
- **EAS Update** — pushes JS + asset bundles **over the air (OTA)** to a
  **channel**, with no rebuild. This is how JS/TS-only changes ship — including
  changes to `@repo/{api-client,env,shared}`.

The rule of thumb: **native change → new build; JS-only change → OTA update.**
`runtimeVersion` (below) is what enforces that boundary.

This doc covers the two ways to distribute: **internal builds + OTA** (no paid
accounts), and **TestFlight / store submission** (needs paid developer accounts)
— see [iOS: TestFlight & the App Store](#ios-testflight--the-app-store).

## What's already config-as-code

Committed in the repo — nothing to do in a dashboard for these:

| File | Provides |
| --- | --- |
| [`apps/mobile/app.json`](../apps/mobile/app.json) | `ios.bundleIdentifier` + `android.package` = `io.github.bpb27.monostarter.mobile` (**if you fork this template, change this to your own namespace + re-run `eas init`**), plus `extra.eas.projectId`, `owner`, `updates.url`, `runtimeVersion`, plugins, typed routes |
| [`apps/mobile/eas.json`](../apps/mobile/eas.json) | Build profiles (`development` / `preview` / `production`) and their EAS Update **channels** (`preview`, `production`) |
| [`apps/mobile/metro.config.js`](../apps/mobile/metro.config.js) | pnpm-monorepo resolution — EAS Build packs the whole workspace from the repo root, so `@repo/*` resolves in the cloud build |

## One-time setup (you — needs your Expo login)

These write into `app.json` and require authenticating to your Expo account, so
run them locally and **commit the result**. `eas-cli` is already a root devDep;
run from `apps/mobile/`:

```bash
cd apps/mobile
npx eas login                 # your Expo credentials — Claude can't do this step
npx eas init                  # creates the EAS project; writes extra.eas.projectId + owner into app.json
npx eas update:configure      # writes updates.url + runtimeVersion into app.json (enables OTA)
```

After these, `app.json` gains an `extra.eas.projectId`, an `owner`, an
`updates.url` (`https://u.expo.dev/<projectId>`), and a `runtimeVersion` policy.
Commit that — it's config-as-code from then on.

> **runtimeVersion policy.** `eas update:configure` defaults this to the
> `appVersion` policy; **change it to `{"policy": "fingerprint"}`** (already done
> in this repo's `app.json`). Fingerprint hashes the native layer so an OTA
> update only reaches builds whose native code matches. Change a native module /
> plugin / SDK and the fingerprint changes → EAS correctly refuses to OTA it and
> you build instead. `appVersion` would happily push mismatched JS to an old
> native build.

## Expo dashboard configuration (the non-code bits)

### Environment variables

Mobile reads `EXPO_PUBLIC_*` vars (see [`.env.example`](../apps/mobile/.env.example)).
Local dev uses `apps/mobile/.env`; **cloud builds and updates do not see that
file** (it's gitignored). Set them as **EAS Environment Variables** —
dashboard (Project → Environment Variables) or CLI — scoped per environment:

```bash
# run once per value, per environment (production / preview / development)
npx eas env:create --name EXPO_PUBLIC_API_URL --environment production \
  --value https://server-production-c625.up.railway.app
npx eas env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --environment production \
  --value pk_live_...
```

| Variable | production | preview / development |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | prod Railway server domain | preview server domain, or your machine's LAN IP for local dev |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | `pk_test_…` |

> **`EXPO_PUBLIC_*` is public, not secret.** Anything with that prefix is
> **inlined into the JS bundle** at build/update time and is readable by anyone
> with the app. That's fine for these two — an API URL and a Clerk *publishable*
> key are both meant to be public. **Never** put a server secret (Clerk secret
> key, DB URL) behind an `EXPO_PUBLIC_` name.

### Signing credentials — auto-managed

Don't pre-create anything. On your first `eas build`, EAS offers to generate and
store the signing material for you:

- **Android** — a keystore, generated and kept on EAS servers. No account cost.
- **iOS** — a distribution certificate + provisioning profile. **This requires
  an Apple Developer account** (see the iOS caveat below).

Accept the managed flow. The keys live on EAS, not in the repo (the
[`.gitignore`](../apps/mobile/.gitignore) already excludes `*.jks`, `*.p8`,
`*.p12`, `*.mobileprovision`).

## Building (internal distribution)

```bash
npx eas build --profile preview --platform android   # or ios / all
```

**Platform reality without paid store accounts:**

- **Android** — builds an installable APK you distribute via the EAS link/QR. No
  account cost. (Publishing to Google Play later needs a one-time $25 account.)
- **iOS** — on-device internal distribution needs an **Apple Developer account
  ($99/yr)** to register device UDIDs and issue ad-hoc provisioning
  (`eas device:create` → build). **Without it, iOS builds are simulator-only**
  (`--profile development` for the dev client, run in the iOS Simulator). This is
  an Apple constraint, not an EAS one.

So with zero paid accounts you can fully exercise Android on-device + iOS
simulator, which is enough to validate the pipeline.

## OTA updates (EAS Update)

Once a build from a given profile is installed, ship JS/asset changes to it
without rebuilding:

```bash
npx eas update --channel production --message "fix header copy"
```

The build profile's `channel` (set in `eas.json`) links a build to the channel
it pulls updates from: `production` builds ← `production` channel, `preview`
builds ← `preview` channel. An update only reaches builds whose
**`runtimeVersion` matches** — so:

- **JS/TS, assets, `@repo/*` TS** → `eas update` (OTA, seconds).
- **New native module, config-plugin change, Expo SDK bump** → `runtimeVersion`
  changes → **new `eas build`** required; an OTA to old builds won't (and
  shouldn't) apply.

## iOS: TestFlight & the App Store

TestFlight is iOS **store** distribution — the `internal`/ad-hoc path above does
**not** reach it. Requires an **Apple Developer Program** membership ($99/yr).
The bundle id is already a real one (`io.github.bpb27.monostarter.mobile`), so:

1. **Build for store distribution** — the `production` profile has no
   `distribution` key, so it defaults to `store` (correct for TestFlight):
   ```bash
   npx eas build --profile production --platform ios
   ```
   EAS prompts you to log into Apple; it then **registers the bundle id** on the
   Developer portal and **auto-generates** the distribution certificate +
   provisioning profile (stored on EAS). Nothing to pre-create on Apple's side.
2. **Submit to TestFlight:**
   ```bash
   npx eas submit --profile production --platform ios
   ```
   On first run it can **create the App Store Connect app record** for you. Auth
   is easiest with an **App Store Connect API key** (App Store Connect → Users
   and Access → Integrations → generate a key).
3. Apple processes the build (~minutes) → available to **internal** TestFlight
   testers immediately (up to 100, no review). **External** testers (up to 10k)
   need a one-time Beta App Review.

For CI / repeatable submits, fill `eas.json`'s `submit.production.ios` with
`ascAppId`, `appleTeamId`, and the API key (`ascApiKeyPath` / `ascApiKeyId` /
`ascApiKeyIssuerId`). Left empty, `eas submit` just prompts interactively.

## Android: Google Play

Building an APK/AAB needs no account (see [Building](#building-internal-distribution)).
**Publishing** to Google Play needs a one-time **$25** Play Console account, then
a Google **service-account JSON** referenced from `submit.production.android`,
and `npx eas submit --profile production --platform android`.

## CI (optional, later)

EAS builds/updates are usually driven from CI (GitHub Actions with an
`EXPO_TOKEN` secret): OTA on merge to `main`, native build when the fingerprint
changes. This is also where mobile's Turbo-graph awareness would live — the
analogue of the watch-paths discussion in
[railway-setup.md](railway-setup.md#watch-paths--the-dependency-graph). Out of
scope for the initial setup.
