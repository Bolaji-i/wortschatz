# Wortschatz 🇩🇪

A German vocabulary app for Android: learn new words every day, write your own sentence with each one, and review them with spaced repetition so they stick.

## What it does

- **Your study plan** – pick any level from **A2 to C1**, or combine several (e.g. B2 + C1). Each selected level gets an equal share of the day. Choose **1–30 new words per day** with the stepper or presets. A first-run setup asks for both; change them any time via *Ändern* on the Heute page or in *Mehr*. Changes apply to today straight away (words you’ve already practised stay).
- **Heute** – your daily words, with article (colour-coded **der / die / das**), plural or verb forms, meaning, an example sentence and pronunciation. Tap *weitere Wörter lernen* any time for more.
- **Write your own sentence** for every word. The app checks offline that you used the word (any form: *leidet, litt, gelitten*), capitalisation, nouns capitalised, punctuation, and shows grammar tips. If it can’t spot an unusual form, you can still save. The day counts towards your streak when every word has a sentence.
- **Optional AI feedback** – add a Claude API key in *Mehr* and every sentence gets real corrections and an explanation in simple English.
- **Wiederholen** – spaced repetition (1 → 2 → 4 → 7 → 15 → 30 → 60 → 120 days). Mixed question types: meaning, German word from English, article quiz, and fill-in-the-gap.
- **Fortschritt** – words learned per level, mastered, streak, 7-day activity, searchable list of all your words and sentences.
- Daily reminder notification, speech speed, backup & restore, dark mode. Works fully offline.

**2,409 words** are included:

| Level | Words | Focus |
|---|---|---|
| A2 | 651 | everyday words learners often miss |
| B1 | 727 | work, feelings, society, verbs with prepositions |
| B2 | 631 | argumentation, business, nuanced verbs, idioms |
| C1 | 400 | abstract & academic vocabulary, elegant verbs, fixed phrases, idioms |

---

## Get it on your phone

### Option A – Let GitHub build the APK (no Android Studio needed)

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
3. Open the repo's **Actions** tab – the *Build Android APK* job runs automatically (~5–8 min).
4. On your phone, open `https://github.com/<your-username>/wortschatz/releases` and tap **Wortschatz.apk**.
5. Android will ask to allow installs from your browser → allow → **Install**.

Every push to `main` builds a new version. Because the app is always signed with the same key (`android/app/wortschatz-debug.jks`), new versions install as updates and **your progress is kept**.

### Option B – Android Studio

Requirements: Node 20+, Android Studio (with JDK 21, which it bundles).

```bash
npm install
npm run android        # builds, syncs and opens Android Studio
```

In Android Studio, plug in your phone (USB debugging on) and press ▶ Run.
Or build an APK via *Build → Build App Bundle(s) / APK(s) → Build APK(s)*.

### Develop in the browser

```bash
npm install
npm run dev            # http://localhost:5173 – use phone size in DevTools
```

After changing code, run `npm run sync` (or push to GitHub) to update the Android app.

---

## Tips

- **No voice?** On the phone: *Settings → System → Languages → Text-to-speech output* and install the German voice for Google's speech engine.
- **Reminder not showing?** Allow notifications for Wortschatz in Android settings, and exclude it from battery optimisation if your phone is aggressive about it.
- **AI feedback:** create a key at <https://console.anthropic.com>, then *Mehr → KI-Feedback* → paste it → *Verbindung testen*. The key is stored only on your phone and sent only to `api.anthropic.com`. Each check costs a fraction of a cent.
- **Backup:** *Mehr → Sicherung kopieren* copies your progress as text – paste it into a note. *Sicherung einfügen* restores it.

## Adding words

Words live in `src/data/lists/` – one line per word, fields separated by ` | `:

```
N die Gefahr, Gefahren | danger | Rauchen ist eine Gefahr. | Smoking is a danger.
N das Vertrauen, — | trust | Vertrauen ist wichtig. | Trust is important.
V leiden (leidet, litt, hat gelitten) | to suffer | Viele leiden unter Stress. | Many suffer from stress. | leiden unter + Dativ
V aufgeben (gibt auf, gab auf, hat aufgegeben) | to give up | Gib nicht auf! | Don’t give up!
A gefährlich | dangerous | Die Straße ist gefährlich. | The road is dangerous.
D trotzdem | nevertheless | Es regnet, trotzdem gehe ich. | It’s raining, I’m going anyway.
K obwohl | although | Obwohl ich müde bin, lerne ich. | Although I’m tired, I study.
P Bescheid sagen | to let someone know | Sag mir Bescheid! | Let me know! | +bescheid
```

`N` noun · `V` verb · `A` adjective · `D` adverb · `K` conjunction · `P` phrase. An optional 5th field is a usage tip; `+form1, form2` lists extra word starts the sentence checker should accept. Verb forms (*leide, litt, gelitten, gib … auf*) are worked out automatically from the three forms in brackets.

Run `npm run check-words` after editing – it catches duplicates and examples that don’t contain their word. (It also runs automatically on every build.)

## Project structure

```
src/
  data/lists/*.ts          word lists (A2 / B1 / B2 / C1)
  data/parse.ts            list format + automatic verb forms
  data/words.ts            loads and mixes the lists
  lib/store.ts             progress, daily words, streak, spaced repetition (saved on device)
  lib/check.ts             offline sentence checker + fill-in-the-gap questions
  lib/ai.ts                optional Claude feedback
  lib/device.ts            text-to-speech and daily reminder
  views/                   Heute, Wiederholen, Fortschritt, Mehr
  components/              WordCard, PracticeModal, StudyPlan (levels + daily goal), PlanModal
android/                   native Android project (Capacitor)
.github/workflows/         automatic APK build
```

Built with Vue 3, Ionic 9 and Capacitor 8.
