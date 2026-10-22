# সেটআপ গাইড (বাংলায়) — শুধু GitHub + Firebase (Netlify ছাড়াই)

এই ভার্সনে শুধু **২টা প্ল্যাটফর্ম** লাগে: GitHub (কোড) আর Firebase (ব্যাকএন্ড + হোস্টিং)। কোনো তৃতীয় সার্ভিস (Netlify) লাগে না, আর **তোমার কম্পিউটারে Node.js ইনস্টল করারও দরকার নেই** — GitHub-এ পুশ করলে GitHub নিজেই বিল্ড করে Firebase-এ ডিপ্লয় করে দেবে (GitHub Actions দিয়ে)।

---

## ধাপ ১: Firebase প্রজেক্ট তৈরি করো

1. **https://console.firebase.google.com** → **"Add project"**
2. নাম দাও (যেমন `darul-barakah`), Analytics স্কিপ করতে পারো
3. **Build → Authentication → Get started → Email/Password → Enable**
4. **Build → Firestore Database → Create database → Location: `asia-southeast1` (Singapore) → Production mode**
5. **Build → Hosting → Get started** (শুধু একবার ক্লিক করে রাখো — আসল সেটআপ নিচে ধাপ ৫-এ হবে)
6. **কোনো Blaze লাগবে না** — এই ভার্সনে Cloud Function নেই, তাই Spark (ফ্রি) প্ল্যানেই সব চলবে।

---

## ধাপ ২: Firestore Rules পেস্ট করো

1. **Firestore Database → Rules** ট্যাবে যাও
2. এই প্রজেক্টের `firestore.rules` ফাইলের পুরো কনটেন্ট কপি করে কনসোলের এডিটরে পেস্ট করো
3. **Publish** চাপো

---

## ধাপ ৩: Firebase SDK কনফিগ সংগ্রহ করো

**⚙️ Project settings → General → Your apps → `</>` (Web) → Register app** — `firebaseConfig = {...}` অবজেক্টটা কপি করে রাখো (পরে GitHub Secrets-এ বসাবে)।

---

## ধাপ ৪: কোড GitHub-এ আপলোড করো

1. **https://github.com** এ **Private** রিপোজিটরি বানাও (যেমন `darul-barakah-app`)
2. রিপোজিটরি পেজে **"uploading an existing file"** → এই zip এক্সট্র্যাক্ট করে ভেতরের সব ফাইল/ফোল্ডার টেনে এনে আপলোড করো → **Commit changes**

**⚠️ `.env` ফাইল (যদি নিজে বানিয়ে থাকো) আপলোড কোরো না** — `.env.example` আপলোড করা নিরাপদ (ওটা খালি টেমপ্লেট)।

---

## ধাপ ৫: GitHub Actions দিয়ে অটো-ডিপ্লয় সেটআপ করো (Cloud Shell দিয়ে, একবারই)

এই একটা ধাপই Netlify-এর কাজ প্রতিস্থাপন করে — Firebase-এর নিজস্ব অফিসিয়াল টুল দিয়ে, যা GitHub-এ একটা ওয়ার্কফ্লো ফাইল আর প্রয়োজনীয় সিক্রেট অটোমেটিক বানিয়ে দেয়। পুরোটাই ব্রাউজারে হবে, কিছু ইনস্টল করা লাগবে না।

1. **https://console.cloud.google.com** → উপরে বাম দিকে তোমার Firebase প্রজেক্ট সিলেক্ট করো → উপরে ডান কোনায় **`>_`** (Cloud Shell) আইকনে ক্লিক করো
2. Cloud Shell-এ চালাও:
   ```bash
   npm install -g firebase-tools
   firebase login --no-localhost
   ```
   (লিংকে ক্লিক করে Google দিয়ে অনুমতি দাও, কোড পেস্ট করো)
3. তোমার GitHub রিপোজিটরি ক্লোন করো (রিপোটা Private হলে GitHub একটা পারসোনাল অ্যাক্সেস টোকেন চাইবে — GitHub → Settings → Developer settings → Personal access tokens থেকে একটা বানিয়ে পাসওয়ার্ডের জায়গায় পেস্ট করো):
   ```bash
   git clone https://github.com/তোমার-ইউজারনেম/darul-barakah-app.git
   cd darul-barakah-app
   ```
4. এবার অটো-ডিপ্লয় সেটআপ কমান্ড চালাও:
   ```bash
   firebase init hosting:github
   ```
   এটা কয়েকটা প্রশ্ন করবে:
   - *"For which GitHub repository..."* → `তোমার-ইউজারনেম/darul-barakah-app` লিখো
   - *"Set up a workflow to run a build script before every deploy?"* → **Yes**, script: `npm ci && npm run build`
   - *"Set up automatic deployment to your site's live channel when a PR is merged?"* → **Yes**, branch: `main`
   - এটা GitHub-এ লগইন করতে বলবে (ব্রাউজারে), অনুমতি দাও

   শেষে এটা নিজে থেকেই তোমার রিপোতে `.github/workflows/firebase-hosting-merge.yml` ফাইল বানিয়ে কমিট করে দেবে, আর দরকারি Firebase সিক্রেট GitHub-এ যোগ করে দেবে।

5. **এখন ফায়ারবেস কনফিগ (ধাপ ৩-এর মান) GitHub Secrets-এ যোগ করো**, যাতে বিল্ডের সময় `.env`-এর কাজ হয়:
   - GitHub রিপোতে **Settings → Secrets and variables → Actions → "New repository secret"**
   - একে একে এই নামে যোগ করো (প্রতিটার ভ্যালু ধাপ ৩-এর `firebaseConfig` থেকে):
     `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_ORG_NAME`, `VITE_ORG_TAGLINE`, `VITE_ORG_ADDRESS`, `VITE_ORG_CURRENCY`
6. GitHub রিপোতে গিয়ে `.github/workflows/firebase-hosting-merge.yml` ফাইলটা খোলো (pencil ✏️ আইকনে ক্লিক করে ব্রাউজারেই এডিট করা যায়), আর `npm ci && npm run build` লাইনটার ঠিক উপরে এই অংশটা যোগ করো, যাতে Action বিল্ডের সময় সিক্রেটগুলো ব্যবহার করে:
   ```yaml
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_ORG_NAME: ${{ secrets.VITE_ORG_NAME }}
        VITE_ORG_TAGLINE: ${{ secrets.VITE_ORG_TAGLINE }}
        VITE_ORG_ADDRESS: ${{ secrets.VITE_ORG_ADDRESS }}
        VITE_ORG_CURRENCY: ${{ secrets.VITE_ORG_CURRENCY }}
   ```
   (ইন্ডেন্টেশন/স্পেসিং গুরুত্বপূর্ণ — `env:` লাইনটা `- run: npm ci && npm run build` লাইনের ঠিক একই লেভেলে বসবে, YAML ফাইল। নিশ্চিত না হলে এই লাইনগুলো কপি করে আমাকে পাঠাও, আমি ঠিক জায়গায় বসিয়ে পুরো ফাইলটা লিখে দেব।)
7. Commit করো — এখনই প্রথম ডিপ্লয় শুরু হয়ে যাবে (GitHub রিপোর **Actions** ট্যাবে প্রগ্রেস দেখা যাবে, ২-৩ মিনিট লাগবে)
8. শেষে তোমার সাইট পাবে: `https://তোমার-প্রজেক্ট-আইডি.web.app`

**এরপর থেকে** যখনই GitHub-এ কোনো ফাইল বদলে কমিট করবে (main ব্রাঞ্চে), এই Action নিজে থেকেই বিল্ড+ডিপ্লয় করে দেবে — তোমার কম্পিউটারে কিছু করা লাগবে না।

---

## ধাপ ৬: নিজের Super Admin অ্যাকাউন্ট বানাও

1. লাইভ লিংক খোলো, **"Super Admin হিসেবে সাইন-আপ করুন"** এ ক্লিক করো
2. ইমেইল, পাসওয়ার্ড, নাম দাও — তুমিই এখন একমাত্র ও হিডেন Super Admin

*(Firebase Hosting ব্যবহার করায় একটা ধাপ এমনিতেই বাদ পড়ে গেছে — আগে Netlify ব্যবহার করলে যেমন "Authorized domains"-এ আলাদা করে ডোমেইন যোগ করতে হতো, Firebase Hosting-এর নিজের ডোমেইন স্বয়ংক্রিয়ভাবেই অনুমোদিত থাকে।)*

---

## ধাপ ৭: Director, Admin, সদস্য যোগ করো

Users ট্যাব থেকে — Admin বানানোর সময় কোন কোন মডিউল দেখবে টিক দাও, সদস্যের জন্য নাম/ইমেইল/মোবাইল/শেয়ার দাও। প্রতিবার তৈরির পর একটা পপ-আপে ইমেইল+পাসওয়ার্ড দেখাবে — লিখে/স্ক্রিনশট নিয়ে পাঠিয়ে দাও।

---

## কোড পরে পরিবর্তন করলে

GitHub-এ ফাইল এডিট করে commit করলেই GitHub Actions স্বয়ংক্রিয়ভাবে বিল্ড+ডিপ্লয় করে দেবে। `firestore.rules` পরিবর্তন করলে সেটা আলাদাভাবে Firebase কনসোলের Rules ট্যাবে গিয়ে আবার পেস্ট করে Publish করতে হবে (এটা GitHub ডিপ্লয়ের সাথে অটো সিঙ্ক হয় না)।

---

## সাধারণ সমস্যা ও সমাধান

| সমস্যা | সমাধান |
|---|---|
| GitHub Actions-এ বিল্ড ব্যর্থ, "Missing VITE_FIREBASE_..." এরর | ধাপ ৫.৫-৫.৬ ঠিকমতো হয়নি — GitHub Secrets আর workflow ফাইলের `env:` অংশ আবার চেক করো |
| "Missing or insufficient permissions" | Firestore Rules পেস্ট/Publish করা হয়নি (ধাপ ২), অথবা ভুল রোলে লগইন করা আছে |
| কোনো লিস্ট/রিপোর্ট খালি, কনসোলে ইনডেক্স-সংক্রান্ত এরর | Firebase যে লিংক দিয়েছে এররে, সেখানে ক্লিক করে ইনডেক্স তৈরি হতে ১-২ মিনিট অপেক্ষা করো |
| PDF/Excel বাটনে কিছু হচ্ছে না | ইন্টারনেট সংযোগ চেক করো (jsPDF/SheetJS CDN থেকে লোড হয়) |
| অফলাইনে অ্যাপ প্রথমবার খুলছে না | প্রথমবার অবশ্যই ইন্টারনেট থাকা অবস্থায় একবার অ্যাপটা খুলতে হবে (Service Worker তখনই ইনস্টল হয়) |
| `firebase init hosting:github` কমান্ড GitHub অনুমোদন চাইছে কিন্তু এগোচ্ছে না | Cloud Shell-এ যে ব্রাউজার ট্যাব খুলেছে সেখানে অনুমোদন শেষ করে Cloud Shell-এ ফিরে এসো, মাঝে মাঝে Cloud Shell-এর পপ-আপ ব্লক হয় — ম্যানুয়ালি দেখানো লিংকে ক্লিক করো |
