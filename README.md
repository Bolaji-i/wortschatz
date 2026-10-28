# Super Wortschatz 🇩🇪

A German vocabulary app for **Android, iPhone and the web**: learn new words every day, write your own sentence with each one, and review them with spaced repetition so they stick. Interface in **English or German**.

## Features

- **Study plan** – pick any level from **A1 to C2** (or combine several) and **1–30 new words per day**.
- **Today** – daily words with colour-coded article (**der / die / das**), plural or verb forms, meaning, example sentence and pronunciation.
- **Write your own sentence** – checked offline for the word (in any form: *leidet, litt, gelitten*), capitalisation and punctuation, with grammar tips.
- **Optional AI feedback** – bring your own **Claude, ChatGPT or Gemini** API key for real corrections and explanations. Keys stay on your device.
- **Review** – spaced repetition (1 → 2 → 4 → 7 → 15 → 30 → 60 → 120 days) with mixed question types: meaning, German from English, article quiz, fill-in-the-gap.
- **Progress** – words per level, streak, 7-day activity and a searchable list of your words and sentences.
- Daily reminder, backup & restore, dark mode. Works fully offline. No accounts, ads or tracking ([privacy policy](public/privacy.html)).

**7,115 words** included:

| Level | Words | Focus |
|---|---|---|
| A1 | 922 | first words: people, home, food, city, time, everyday verbs |
| A2 | 1,075 | everyday life, work, travel, health, shopping |
| B1 | 1,382 | work, feelings, society, verbs with prepositions |
| B2 | 1,483 | argumentation, business, media, nuanced verbs, idioms |
| C1 | 1,241 | abstract & academic vocabulary, elegant verbs, fixed phrases |
| C2 | 1,012 | rare & literary words, fine nuances, idioms, register |

## Try it

**Android:** open the [latest release](https://github.com/Bolaji-i/wortschatz/releases/latest) on your phone, tap **Wortschatz.apk** and allow the install. New builds install as updates and keep your progress.

**iPhone:** the release also includes an unsigned `Wortschatz.ipa`, which can be installed with [Sideloadly](https://sideloadly.io) or [AltStore](https://altstore.io).

## Run locally

Requires Node 22+.

```bash
npm install
npm run dev        # web version at http://localhost:5173
npm run android    # build and open in Android Studio
npm run ios        # build and open in Xcode (macOS)
```

## Adding words

Word lists live in `src/data/lists/`, one file per level and topic (e.g. `b1-work.ts`), one word per line:

```
N die Gefahr, Gefahren | danger | Rauchen ist eine Gefahr. | Smoking is a danger.
V leiden (leidet, litt, hat gelitten) | to suffer | Viele leiden unter Stress. | Many suffer from stress. | leiden unter + Dativ
```

`N` noun · `V` verb · `A` adjective · `D` adverb · `R` preposition · `K` conjunction · `P` phrase. Run `npm run check-words` after editing to regenerate the index and catch duplicates.

## Built with

Vue 3, Ionic and Capacitor. Android and iOS builds run on GitHub Actions on every push to `main`.
