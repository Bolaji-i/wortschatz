# Privacy and content questionnaires

Both stores ask what data the app collects. Super Wortschatz itself collects nothing, but with **optional AI feedback** the app sends the word and the learner's sentence (plus their own API key) **from the device straight to Anthropic, OpenAI or Google**. The stores count data sent to a third party as "shared/collected" even if you never see it. The answers below declare that honestly; that is the safe choice and avoids a rejection later.

---

## Google Play – Data safety (*Policy and programs → App content → Data safety*)

**Does your app collect or share any of the required user data types?** → **Yes**

**Is all of the user data collected by your app encrypted in transit?** → **Yes** (all AI requests use HTTPS)

**Which of the following methods of account creation does your app support?** → **My app does not allow users to create an account**

**Do you provide a way for users to request that their data is deleted?** → **No** (the developer stores no data; users delete it in the app with *More → Reset progress* or by uninstalling). If the form insists, explain this in the optional URL/notes.

**Data types** – tick only:

| Category → type | Collected | Shared | Ephemeral* | Required? | Purpose |
|---|---|---|---|---|---|
| **App activity → Other user-generated content** (practice sentences sent for AI feedback) | ✅ | ✅ (with the AI provider the user chose) | ✅ Yes | **Optional** – users can choose | App functionality |

\* "Processed ephemerally" = yes: the app does not store the data on any server of yours; it is only sent to the provider for the correction.

Everything else (location, personal info, contacts, financial, health, device IDs, crash logs, analytics…) → **not collected**.

> Data that is stored only on the device and never leaves it does not count as "collected" in Play's definition, so progress, settings and API keys need not be declared.

## Google Play – other App content forms

| Form | Answer |
|---|---|
| **Privacy policy** | `https://<your-username>.github.io/wortschatz/privacy.html` |
| **Ads** | No, my app does not contain ads |
| **App access** | All functionality is available without special access (optional AI feature: mention that it needs the user's own API key) |
| **Content rating** (IARC questionnaire) | Category **Reference, News, or Educational**. Answer **No** to violence, sexuality, language, controlled substances, gambling. *Users can interact / exchange content?* → **No** (nothing is shared between users). *Shares user location?* → No. *Allows purchases?* → No. Result: **PEGI 3 / USK 0 / Everyone**. |
| **Target audience and content** | Ages **13 and over** (13–15, 16–17, 18+). Choosing under-13 brings Families Policy requirements you don't need. *Could the app unintentionally appeal to children?* → No. |
| **News app** | No |
| **Health apps** | None |
| **Financial features** | None |
| **Government app** | No |
| **Data safety** | as above |
| **Advertising ID** | No, my app does not use an advertising ID |

---

## App Store Connect – App Privacy (*App Privacy → Get Started*)

**Do you or your third-party partners collect data from this app?** → **Yes**

Select only: **User Content → Other User Content** (the practice sentences sent for AI feedback)

For *Other User Content*:
- **Purposes:** App Functionality
- **Linked to the user's identity?** → **No**
- **Used for tracking?** → **No**

Result on the store page: *Data Not Linked to You – User Content*. Everything else: not collected.

### Age rating (*App Information → Age Rating*)
Answer **None / No** to every content question. *Unrestricted web access* → No. *User-generated content shared with others* → No. *Messaging and chat* → No. *Advertising* → No. Result: **4+**.

### Export compliance
Already answered in the app (`ITSAppUsesNonExemptEncryption = NO` in Info.plist) – the app only uses standard HTTPS. App Store Connect won't ask on each build.

### Privacy manifest
`ios/App/App/PrivacyInfo.xcprivacy` is included and declares the only "required reason" API the app uses (UserDefaults, reason CA92.1) and no tracking.
