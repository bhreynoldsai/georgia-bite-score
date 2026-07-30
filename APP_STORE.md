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

1. **Signing** — in Xcode, select the App target → Signing & Capabilities →
   choose your Apple Developer team. Bundle ID is `com.truenorth.georgiabitescore`
   (set in `capacitor.config.json`; change it there and re-sync if needed).
2. **Version/build numbers** — App target → General.
3. **Archive & upload** — Product → Archive → Distribute App → App Store
   Connect. (Or `xcodebuild archive` + `xcrun altool`/Transporter in CI.)

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
