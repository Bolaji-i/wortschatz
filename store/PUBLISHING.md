# Publishing Super Wortschatz

This guide takes the app from this repository to **Google Play** and the **Apple App Store**. The builds are made by GitHub Actions, so you don't need Android Studio or a Mac. Allow about **3 weeks for Google Play**, because new personal accounts must run a 14-day closed test first. The App Store usually takes **a few days**.

| | Google Play | App Store |
|---|---|---|
| Account | Play Console, **US$25 once** | Apple Developer Program, **99 €/year** |
| Identity check | ID + address, a few days | ID (D-U-N-S number only for companies), 1–2 days |
| Before you can go public | closed test with **12 testers for 14 days** | App Review, usually 1–2 days |
| Builds come from | `apps.yml` → `SuperWortschatz.aab` | `apps.yml` → uploaded to TestFlight |

App ID / bundle ID in both stores: **`com.voltron.wortschatz`**. It can never change after the first upload.

---

## 0. Before anything else (both stores)

1. **Fill in the privacy policy.** In `public/privacy.html`, replace `[Your name]`, `[Postal address]` and `[contact e-mail]` in both the English and the German part. Under EU/German law (GDPR, DDG) a postal address is required, but it doesn't have to be your home. A business-address service also works.
2. **Turn on GitHub Pages** if you haven't yet: repo → *Settings → Pages → Source: GitHub Actions*. After the next push your policy is online at
   `https://<your-username>.github.io/wortschatz/privacy.html`. Open the link once to check it.
3. Create a **support e-mail address** for the stores (e.g. a new Gmail address). It will be public.
4. Check the version: `versionName` in `android/app/build.gradle`, `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` and `APP_VERSION` in `src/lib/app.ts` (all **1.5** now). Build numbers count up automatically.

---

## 1. Google Play

### 1.1 Create the developer account
1. Go to <https://play.google.com/console/signup> and choose a **personal** account (or *organisation* if you have a company).
2. Pay the US$25 fee and complete identity verification. Verification takes a few days.

### 1.2 Create your upload key (once, 2 minutes)
On your computer, in this project folder:
```bash
bash scripts/make-upload-key.sh
```
- This creates `~/super-wortschatz-keys/` containing the key, a password file and a base64 copy. **Save the folder and the password in your password manager and keep a backup.** The key is never committed to Git (it's covered by `.gitignore`).
- If the GitHub CLI (`gh`) is logged in, the script offers to set the four GitHub Secrets for you. Otherwise add them by hand under *repo → Settings → Secrets and variables → Actions*:
  `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_KEYSTORE_PASSWORD`, `ANDROID_UPLOAD_KEY_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`
- You need `keytool`, which comes with Java or Android Studio. On a Mac: `brew install openjdk`.

Push to `main` (or run *Actions → Build Android & iOS apps → Run workflow*). When the run finishes, download **`play-store-bundle`** from the run's *Artifacts* section. It contains `SuperWortschatz.aab`.

### 1.3 Create the app in the Play Console
1. *Create app* → name **Super Wortschatz: German Words**, default language **English (United States)**, **App**, **Free**, then accept the declarations.
2. **Set up your app** (Dashboard): work through every item using
   - [`privacy-answers.md`](privacy-answers.md) for privacy policy, ads, app access, content rating, target audience and data safety
   - [`listing.md`](listing.md) for the store listing texts and graphics. Add a **German (de-DE)** translation under *Store listing → Manage translations*.
   - Graphics: `icons/play-icon-512.png`, `play-feature-graphic-en.png` (and `-de` for the German listing), and screenshots `screenshots/play-en-*.png` / `play-de-*.png`
3. *Store settings*: category **Education**, plus your contact e-mail.

### 1.4 First upload + closed test (12 testers × 14 days)
New personal accounts have to test with at least **12 people who stay opted in for 14 days in a row** before production is unlocked.
1. *Test and release → Testing → Closed testing → Create track* (or use the default "Alpha").
2. *Countries/regions*: add the countries you want (e.g. all).
3. *Testers*: create an e-mail list with 12 or more Google accounts. Friends, colleagues, people from your German course and other learners all work. Add a few spares, because anyone who leaves early doesn't count.
4. *Create new release* → Play asks about **Play App Signing** → accept (*Use Google-generated key*). Google then holds the real signing key, and your upload key only proves that uploads come from you.
5. Upload `SuperWortschatz.aab`, set release name `1.5`, and add release notes (e.g. "First release").
6. *Review release → Start rollout to Closed testing*. Google reviews it (hours to a few days).
7. Share the **opt-in link** (shown on the track page) with your testers. They must open it, tap *Become a tester* and install the app from Play.
8. Keep testing for 14 days. Upload one or two updates during that time, because Google looks for real engagement. Collect a bit of feedback.
9. After 14 days: *Dashboard → Apply for production* and answer the three short sections (how you tested, who the app is for, what you changed). The review takes up to about 7 days.

### 1.5 Go live
*Production → Create new release* → *Add from library* (pick the tested bundle) → roll out, e.g. to 100%. Done 🎉

### 1.6 Optional: automatic uploads from GitHub
After the first manual upload, every push can go straight to the **internal testing** track:
1. Google Cloud Console → create a project → enable **Google Play Android Developer API** → *IAM → Service accounts → Create* → *Keys → Add key → JSON*.
2. Play Console → *Users and permissions → Invite new users* → the service account's e-mail → app permissions for Super Wortschatz: *Release to testing tracks* (and *Release to production* if you want).
3. GitHub secret **`PLAY_SERVICE_ACCOUNT_JSON`** = the whole JSON file.
4. While the app has never been published, uploads stay as **drafts**. Once it's live, add a repository *variable* (not a secret) `PLAY_RELEASE_STATUS` = `completed` so uploads roll out to internal testers automatically.

Then: push → internal test → promote to production in the Play Console with one click.

### Notes
- The **test APK** on GitHub Releases is signed with a different key, so it **can't update the Play Store app** (or the other way round). To switch, use *More → Copy backup* in the old app, install the Play version, then *Paste backup*.
- Target API level is 36 (Android 16), which Google Play requires for new apps and updates from 31 August 2026.

---

## 2. Apple App Store

### 2.1 Join the Apple Developer Program
<https://developer.apple.com/programs/enroll/> → enrol as an **individual** with your Apple ID (99 €/year). This needs two-factor authentication and usually takes 1–2 days.

### 2.2 Register the app
1. <https://developer.apple.com/account/resources/identifiers> → **+** → *App IDs → App* → description *Super Wortschatz*, **Explicit** bundle ID `com.voltron.wortschatz`. No capabilities are needed (local notifications don't need the Push capability).
2. <https://appstoreconnect.apple.com> → *Apps → + → New App* → platform **iOS**, name **Super Wortschatz**, primary language **English (U.S.)**, bundle ID `com.voltron.wortschatz`, SKU `superwortschatz`, user access *Full access*.
   *If the name is already taken, use "Super Wortschatz – German".*

### 2.3 Let GitHub upload builds (API key, once)
1. App Store Connect → *Users and Access → Integrations → App Store Connect API → Team Keys → +*. Name it `GitHub`, access **Admin**. Admin is needed so the build can create its own signing certificate.
2. Download the **.p8 file**. You can only download it once, so put it in your password manager. Note the **Key ID** and the **Issuer ID** shown above the table.
3. Your **Team ID**: <https://developer.apple.com/account> → *Membership details*.
4. GitHub → *repo → Settings → Secrets and variables → Actions* → add:

   | Secret | Value |
   |---|---|
   | `APPSTORE_API_KEY_ID` | Key ID (e.g. `2X9R4HXF34`) |
   | `APPSTORE_API_ISSUER_ID` | Issuer ID (a UUID) |
   | `APPSTORE_API_PRIVATE_KEY` | the full contents of the .p8 file, including the `-----BEGIN PRIVATE KEY-----` lines |
   | `APPLE_TEAM_ID` | Team ID (10 characters) |

5. Push to `main`. The **iOS App Store upload** job archives the app, signs it automatically (Xcode creates the distribution certificate and profile) and uploads it. After 10–30 minutes of processing, the build shows up under *TestFlight*.
   - First time: TestFlight asks about **export compliance**. The app already answers "no non-exempt encryption" in Info.plist, so it should be pre-filled.

### 2.4 Test with TestFlight
*TestFlight → Internal Testing → +* → add yourself (and up to 100 team members). Install the **TestFlight** app on your iPhone and accept the invite. External testers (up to 10,000) need a short Beta App Review first.

### 2.5 Submit for review
In App Store Connect → your app → *iOS App → 1.5 Prepare for Submission*:
1. **Screenshots**: *6.9" Display* → upload `screenshots/appstore-en-1…5.png`. Switch the language at the top right to **German** (add it first under *App Information → Localizable information*) and upload `appstore-de-*.png`.
2. **Texts**: promotional text, description, keywords, support URL and marketing URL (optional) from [`listing.md`](listing.md), in both languages.
3. **Build**: *Add Build* → pick the TestFlight build.
4. **App Information**: category Education, age rating questionnaire (all "None", which gives **4+**), and the content rights question (*Does it contain third-party content?* → No).
5. **App Privacy**: answer as described in [`privacy-answers.md`](privacy-answers.md), and add the privacy policy URL.
6. **Pricing and Availability**: Free, all countries (or choose).
7. **App Review Information**: your contact details. Turn off "Sign-in required" and paste the review notes from `listing.md`.
8. **Add for Review → Submit**. Reviews usually take 24–48 hours. After approval, release it manually or automatically.

### Notes
- Apple requires apps to be built with **Xcode 26 / the iOS 26 SDK** since 28 April 2026. The workflow uses GitHub's `macos-26` runner, which includes it.
- The app is set to **iPhone only**. It still runs on iPads in iPhone mode, so no iPad screenshots are needed.
- If Apple's review asks about the AI feature: it's optional, off by default, uses the user's own key, and the settings screen states that the word and sentence are sent directly to the chosen provider.

---

## 3. Releasing an update

1. Make your changes and bump the version where you see `1.5` (`build.gradle` `versionName`, `MARKETING_VERSION` in `project.pbxproj`, `APP_VERSION` in `src/lib/app.ts`, `version` in `package.json`).
2. Push to `main`. Android: download the new `.aab` (or let it auto-upload to internal testing) → promote to production. iOS: the build lands in TestFlight → create version 1.x in App Store Connect → pick the build → submit.
3. **Never rename a word's headword** in `src/data/lists/`. The ID links users' progress to the word. If you really must, add the old → new ID to `RENAMED_IDS` in `src/lib/store.ts`.

## 4. If something fails

| Problem | Fix |
|---|---|
| No `play-store-bundle` artifact | The upload-key secrets are missing or misspelt. Check the job log for "Build Play Store bundle". |
| Play: "*You uploaded an APK or Android App Bundle that was signed in debug mode*" | `ANDROID_UPLOAD_KEYSTORE_BASE64` is empty. Run the key script again with the GitHub CLI, or paste the base64 file contents. |
| Play: "*Version code … has already been used*" | Re-run the workflow. Version codes are based on the build time, so each build gets a new one. |
| iOS job: "*No Accounts*" / "*No signing certificate*" | The API key needs the **Admin** role. Also check that the .p8 secret includes the BEGIN/END lines. |
| iOS job: "*No profiles for 'com.voltron.wortschatz'*" | Register the bundle ID (step 2.2.1) and check `APPLE_TEAM_ID`. |
| iOS: "*Redundant binary upload*" / build number already used | Start a **new** run (push, or *Run workflow*). The build number is the GitHub run number, and *Re-run jobs* keeps the old one. |
| Apple rejects with 5.1.1/5.1.2 (privacy) | Make sure the privacy URL works and the App Privacy answers match `privacy-answers.md`. |
