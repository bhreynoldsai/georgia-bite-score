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
- **App icon**: `public/icon-1024.png` (1024×1024, no alpha) for the ASC
  listing.

## Guideline 4.2 ("minimum functionality") risk

Apple rejects thin website wrappers. Mitigations to consider before or after
first submission:

- The app already works offline-degraded and is purpose-built (not a repackaged
  marketing site), which helps.
- Stronger native hooks worth adding: home-screen widget with today's top bite
  window, push notification when a species hits "Excellent", or offline caching
  of the last-fetched scores. Capacitor plugins (`@capacitor/push-notifications`,
  `@capacitor/preferences`) cover most of this.

## Review checklist

- [ ] Test on a physical device (LAN weather/USGS/Anthropic calls all HTTPS — ATS-safe).
- [ ] Verify the guide panel: with `ANTHROPIC_API_KEY` set the panel streams; without it the fallback text renders (never an error state).
- [ ] Screenshots: 6.7" and 6.1" iPhone sizes minimum, dark UI renders well.
- [ ] Confirm `vercel.json` deployment is live — the wrapped app loads the bundled `dist/`, but the guide proxy needs the Vercel deployment.
