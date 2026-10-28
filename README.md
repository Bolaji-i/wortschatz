# Super Wortschatz 🇩🇪

A German vocabulary app for **Android, iPhone and the web**: learn new words every day, write your own sentence with each one, and review them with spaced repetition so they stick. Interface in **English or German**.

## What it does

- **Your study plan** – pick any level from **A1 to C2**, or combine several (e.g. B2 + C1). Each selected level gets an equal share of the day. Choose **1–30 new words per day**. A first-run setup asks for both (and the app language); change them any time on the Today page or in *More*.
- **Today** – your daily words, with article (colour-coded **der / die / das**), plural or verb forms, meaning, an example sentence and pronunciation.
- **Write your own sentence** for every word. The app checks offline that you used the word (any form: *leidet, litt, gelitten*), capitalisation and punctuation, and shows grammar tips.
- **Optional AI feedback (bring your own key)** – choose **Claude, ChatGPT or Gemini**, add your own API key in *More*, and every sentence gets real corrections with an explanation in the app's language.
- **Review** – spaced repetition (1 → 2 → 4 → 7 → 15 → 30 → 60 → 120 days) with mixed question types: meaning, German from English, article quiz, fill-in-the-gap.
- **Progress** – words per level, mastered, streak, 7-day activity, searchable list of all your words and sentences.
- Daily reminder, speech speed, backup & restore, dark mode. Works fully offline. No accounts, ads or tracking ([privacy policy](public/privacy.html)).

**7,115 words** are included:

| Level | Words | Focus |
|---|---|---|
| A1 | 922 | first words: people, home, food, city, time, everyday verbs |
| A2 | 1,075 | everyday life, work, travel, health, shopping |
| B1 | 1,382 | work, feelings, society, verbs with prepositions |
| B2 | 1,483 | argumentation, business, media, nuanced verbs, idioms |
| C1 | 1,241 | abstract & academic vocabulary, elegant verbs, fixed phrases |
| C2 | 1,012 | rare & literary words, fine nuances, idioms, register |

## Publishing to Google Play and the App Store

Everything for the stores is in [`store/`](store/): the step-by-step guide **[store/PUBLISHING.md](store/PUBLISHING.md)**, listing texts in English and German ([store/listing.md](store/listing.md)), privacy answers ([store/privacy-answers.md](store/privacy-answers.md)), screenshots and the feature graphic.

---

## Put the code on GitHub (needed for all automatic builds)

1. Create a new **public** repository on GitHub (e.g. `wortschatz`).
2. In this folder run:
   ```bash
   git init
   git add .
   git commit -m "Wortschatz app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/wortschatz.git
   git push -u origin main
   ```
3. Every push to `main` now runs **Build Android & iOS apps** (Actions tab, ~10 min). It publishes a release containing `Wortschatz.apk` (Android) and `Wortschatz.ipa` (iPhone).

---

## Android

### Option A – Download from GitHub (no Android Studio needed)

1. On your phone, open `https://github.com/<your-username>/wortschatz/releases` and tap **Wortschatz.apk**.
2. Android will ask to allow installs from your browser → allow → **Install**.

Because the test build is always signed with the same key (`android/app/wortschatz-debug.jks`), new versions install as updates and **your progress is kept**. (The Play Store version is signed differently, so it installs as a separate app – move your progress with *More → Copy backup*.)

### Option B – Android Studio

Requirements: Node 20+, Android Studio (with JDK 21, which it bundles).

```bash
npm install
npm run android        # builds, syncs and opens Android Studio
```

Plug in your phone (USB debugging on) and press ▶ Run, or *Build → Build APK(s)*.

---

## iPhone

Apple only lets apps be built on a Mac and only installs apps signed with an Apple ID. Pick whichever option fits:

| | No Mac needed | Apple account | Reminders | Updates |
|---|---|---|---|---|
| **A. Home-screen app** | ✅ | none | ❌ | automatic |
| **B. Sideload the .ipa** | ✅ (needs a Windows PC or Mac) | free Apple ID | ✅ | re-sign every 7 days* |
| **C. Xcode** | ❌ | free Apple ID or paid | ✅ | re-sign every 7 days* |
| **D. TestFlight / App Store** | ❌ | Apple Developer Program (99 €/year) | ✅ | automatic |

\* with a free Apple ID. A paid developer account makes installs last a year.

### Option A – Add to Home Screen (easiest, free)

The same app also runs as a web app that lives on your home screen, full screen and offline.

1. One-time: in your GitHub repo go to **Settings → Pages → Source: GitHub Actions**. The **Publish web version** workflow then deploys on every push.
2. On your iPhone, open **`https://<your-username>.github.io/wortschatz/`** in **Safari**.
3. Tap **Share** → **Add to Home Screen** → **Add**.

Everything works the same except the daily reminder notification (that needs the native app). Progress is saved on the phone.

### Option B – Install the native app without a Mac (Sideloadly / AltStore)

1. Download **Wortschatz.ipa** from your repo’s **Releases** page (on a PC or Mac).
2. Install **[Sideloadly](https://sideloadly.io)** (Windows/Mac) or **[AltStore](https://altstore.io)**, connect your iPhone by cable, drop in the `.ipa` and sign in with your Apple ID.
3. On the iPhone: **Settings → Privacy & Security → Developer Mode → On** (restart when asked), then **Settings → General → VPN & Device Management → trust your Apple ID**.

With a free Apple ID the app must be re-signed every 7 days (AltStore can refresh it automatically over Wi-Fi). Your progress is kept when you re-sign or update.

### Option C – Build with Xcode (needs a Mac)

Requirements: Node 22+, Xcode 26 or newer (required by Apple for App Store uploads since April 2026).

```bash
npm install
npm run ios            # builds, syncs and opens Xcode
```

In Xcode: select the **App** target → **Signing & Capabilities** → choose your **Team** (sign in with your Apple ID; change the bundle identifier if Xcode says it’s taken). Plug in your iPhone, select it at the top and press ▶ Run. The first time, trust the developer on the phone as in Option B, step 3.

### Option D – TestFlight / App Store

With an [Apple Developer Program](https://developer.apple.com/programs/) membership, GitHub Actions uploads every build to App Store Connect automatically – see [store/PUBLISHING.md](store/PUBLISHING.md). Install via the **TestFlight** app, or publish to the App Store.

---

## Develop in the browser

```bash
npm install
npm run dev            # http://localhost:5173 – use phone size in DevTools
```

After changing code, run `npm run sync` (or push to GitHub) to update both native apps.

---

## Tips

- **No voice?** Android: *Settings → System → Languages → Text-to-speech output* → install the German voice. iPhone: *Settings → Accessibility → Spoken Content → Voices → German* → download a voice (e.g. *Anna (Enhanced)*) for nicer pronunciation.
- **Reminder not showing?** Allow notifications for the app (Android settings / iPhone *Settings → Notifications → Wortschatz*). On Android, also exclude it from battery optimisation if your phone is aggressive about it.
- **AI feedback:** *More → AI feedback* → pick a provider → paste its key → *Test connection*.
  | Provider | Get a key | Default model | Cost |
  |---|---|---|---|
  | Claude (Anthropic) | [console.anthropic.com](https://console.anthropic.com/settings/keys) | `claude-haiku-5-5` | pay per use, a fraction of a cent per sentence |
  | ChatGPT (OpenAI) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `gpt-5-mini` | pay per use, a fraction of a cent per sentence |
  | Gemini (Google) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `gemini-flash-latest` | usually a free daily quota |

  You can save a key for each provider and switch any time. *Load list* shows the models your key can use, so you can pick a newer or cheaper one. Keys stay on your phone, are sent only to the provider you chose, and are never included in backups.
- **Backup / moving phones:** *More → Copy backup* copies your progress as text – paste it into a note. *Paste backup* restores it. This also moves your progress between Android, iPhone and the home-screen version.

## Adding words

Words live in `src/data/lists/` – one file per topic, named `<level>-<name>.ts` (e.g. `b1-work.ts`). The level comes from the file name; `*-core.ts` files are taught first, then the topic files take turns. One line per word, fields separated by ` | `:

```
N die Gefahr, Gefahren | danger | Rauchen ist eine Gefahr. | Smoking is a danger.
N das Vertrauen, — | trust | Vertrauen ist wichtig. | Trust is important.
V leiden (leidet, litt, hat gelitten) | to suffer | Viele leiden unter Stress. | Many suffer from stress. | leiden unter + Dativ
V aufgeben (gibt auf, gab auf, hat aufgegeben) | to give up | Gib nicht auf! | Don’t give up!
R trotz | despite | Trotz des Regens gehen wir spazieren. | Despite the rain we go for a walk. | trotz + Genitiv
A gefährlich | dangerous | Die Straße ist gefährlich. | The road is dangerous.
D trotzdem | nevertheless | Es regnet, trotzdem gehe ich. | It’s raining, I’m going anyway.
K obwohl | although | Obwohl ich müde bin, lerne ich. | Although I’m tired, I study.
P Bescheid sagen | to let someone know | Sag mir Bescheid! | Let me know! | +bescheid
```

`N` noun · `V` verb · `A` adjective · `D` adverb · `R` preposition · `K` conjunction · `P` phrase. An optional 5th field is a usage tip; `+form1, form2` lists extra word starts the sentence checker should accept. Verb forms (*leide, litt, gelitten, gib … auf*) are worked out automatically from the three forms in brackets.

Run `npm run check-words` after editing – it regenerates `src/data/words.ts` (so new files are picked up automatically) and catches duplicates and examples that don’t contain their word. (It also runs on every build.) Never change a word's headword once released – its ID is what links users' progress to it.

## Project structure

```
src/
  data/lists/*.ts          word lists, A1–C2 (one file per level + topic)
  data/parse.ts            list format + automatic verb forms
  data/words.ts            generated by scripts/gen-index.mjs – loads and mixes the lists
  lib/i18n.ts              English / German interface texts
  lib/store.ts             progress, daily words, streak, spaced repetition (saved on device)
  lib/check.ts             offline sentence checker + fill-in-the-gap questions
  lib/ai.ts                optional AI feedback (Claude, OpenAI, Gemini)
  lib/device.ts            text-to-speech and daily reminder
  views/                   Today, Review, Progress, More
  components/              WordCard, PracticeModal, StudyPlan (levels + daily goal), PlanModal
android/                   native Android project (Capacitor)
ios/                       native iOS project (Capacitor, Swift Package Manager)
public/                    privacy.html, icons, web manifest and offline service worker for the home-screen version
store/                     store listing texts, screenshots, publishing guide
scripts/                   word-list tools, make-upload-key.sh (Play Store signing key)
.github/workflows/         apps.yml: Android APK/AAB + iOS .ipa/TestFlight · web.yml: home-screen version on GitHub Pages
```

Built with Vue 3, Ionic 9 and Capacitor 8.
