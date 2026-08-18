# App Store submission guide

The iOS app is a Capacitor wrapper around the web build. The native project
lives in `ios/` (Swift Package Manager — no CocoaPods needed).

## Day-to-day workflow

```bash
npm run build        # build the web app into dist/
npx cap sync ios     # copy dist/ into the iOS project + sync plugins
npx cap open ios     # open ios/App/App.xcodeproj in Xcode
```

Icons and splash screens are generated from `assets/` into the Xcode asset
catalog with `npx @capacitor/assets generate --ios`. The master icon artwork is
`public/icon.svg` (rasterize with `node scripts/generate-icons.mjs`, then copy
`public/icon-1024.png` to `assets/icon-only.png`).

## One-time setup before submitting

1. **Signing** — automatic signing is already configured (team `5XV96FMGLV`,
   bundle ID `com.truenorth.georgiabitescore`, set in `capacitor.config.json`).
   Cloud-managed distribution signing works headlessly with
   `-allowProvisioningUpdates`; no distribution cert needs to live in the
   keychain.
2. **Version/build numbers** — `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
   in `ios/App/App.xcodeproj/project.pbxproj` (currently 1.0 / 1). Bump
   `CURRENT_PROJECT_VERSION` for every new upload of the same version.
3. **Create the app record in App Store Connect** — required *before* any
   upload. `xcodebuild` fails with `missingApp(bundleId:)` if it does not
   exist. Create it at appstoreconnect.apple.com → Apps → **+** → New App:
   platform iOS, name, primary language, bundle ID
   `com.truenorth.georgiabitescore`, and an SKU (e.g. `GABITESCORE001`).
4. **Archive & upload** (headless, from the repo root):

```bash
npm run build && npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/GeorgiaBiteScore.xcarchive archive -allowProvisioningUpdates
xcodebuild -exportArchive -archivePath build/GeorgiaBiteScore.xcarchive \
  -exportOptionsPlist build/UploadOptions.plist \
  -exportPath build/upload -allowProvisioningUpdates
```

`build/ExportOptions.plist` (`destination: export`) writes `build/ipa/App.ipa`
locally; `build/UploadOptions.plist` (`destination: upload`) sends the build
straight to App Store Connect. Both use `method: app-store-connect`.

## App Store Connect metadata

- **Privacy nutrition label**: the app collects **no user data**. It calls
  Open-Meteo (weather) and USGS NWIS (river gauges) anonymously, stores only
  the selected lake in local storage, and has no accounts, analytics, or
  tracking. Declare "Data Not Collected".
- **The "Ask the guide" feature** calls `/api/guide` on the Vercel deployment,
  which proxies to the Anthropic API. Prompts contain only weather/score data,
  no personal data. Set `ANTHROPIC_API_KEY` in the Vercel project env or the
  panel falls back to canned summaries.
- **Age rating**: 4+. **Category**: Sports or Weather.
- **Encryption**: `ITSAppUsesNonExemptEncryption = false` is set in
  `Info.plist`, so App Store Connect will not ask the export-compliance
  question on each build.
- **Screenshots**: `store-assets/screenshots/` holds three 1320×2868 (6.9")
  captures — dashboard, guide panel, outlook. That size is the only iPhone set
  Apple requires; it scales them for smaller devices.
- **App icon**: `store-assets/app-icon-1024.png` (1024×1024, alpha removed —
  `public/icon-1024.png` has an alpha channel and App Store Connect rejects it).

## Guideline 4.2 ("minimum functionality") — rejected 2026-08-13, addressed 2026-08-18

1.0 was **rejected** under 4.2: "the app primarily offers content for users to
view or use, but there isn't enough of this content." Fair — v1.0 was one lake,
one dashboard, nothing persisted.

Fix: three new tabs (see CLAUDE.md's "Tabs" section for implementation detail):

- **Compare Lakes** — ranks all 12 lakes by score, not one at a time.
- **7-Day Planner** — forward-looking trip planning, not just "right now."
- **Catch Log** — on-device, user-generated data the app stores and surfaces
  back. This is the strongest of the three against a 4.2 argument.

Before resubmitting:

- [x] Bump `CURRENT_PROJECT_VERSION` (build number) — now `4`.
- [x] Archive + upload build 4 to App Store Connect (headless, via `xcodebuild`
      — see the archive/upload commands above; upload succeeded 2026-08-18).
- [x] Reshoot screenshots — `iphone-6.9-05-compare.png`,
      `-06-planner.png`, `-07-catchlog.png` added (captured on an iPhone 17 Pro
      Max simulator, native 1320×2868, Catch Log seeded with two sample entries
      so it doesn't read empty). The old `01`–`04` set still shows the
      single-lake dashboard only — swap those in as the primary set in App
      Store Connect, or at minimum insert 05–07 among the first few so a
      reviewer scrolling thumbnails sees the new tabs early.
- [ ] In App Store Connect: attach build 4 to the 1.0 version, upload/reorder
      the new screenshots, and reply to the rejection message summarizing what
      was added — reviewers read that thread. (Needs your Apple ID login —
      not something that can be done headlessly.)
- [ ] Resubmit for review.
- [ ] Re-test on the reviewer's device class if possible (iPad Air 11" was the
      review device — confirm the tab bar and grids don't look sparse or
      cramped at that aspect ratio, not just iPhone).

Further hardening if it comes back again: a home-screen widget with today's top
bite window, or a local notification when a saved lake crosses "Excellent"
(`@capacitor/push-notifications` covers the latter without a server).

## Review checklist

- [ ] Test on a physical device (LAN weather/USGS/Anthropic calls all HTTPS — ATS-safe).
- [ ] Verify the guide panel: with `ANTHROPIC_API_KEY` set the panel streams; without it the fallback text renders (never an error state).
- [ ] Screenshots: 6.7" and 6.1" iPhone sizes minimum, dark UI renders well.
- [ ] Confirm `vercel.json` deployment is live — the wrapped app loads the bundled `dist/`, but the guide proxy needs the Vercel deployment.
- [ ] Click through all four tabs (Today / Compare Lakes / 7-Day Planner / Catch Log) on-device before archiving.
