# א.ח.ד הנדסת בניין ובטיחות – אתר תדמית

אתר סטטי (HTML/CSS/JS בלבד, בלי ספריות צד שלישי) עבור דוד חי אברג'ל – בדק בית, חוות דעת הנדסית ומשפטית, אישורי קונסטרוקציה ושירותי בטיחות.

## מבנה

```
src/                 קוד המקור
  index.html         דף הבית
  accessibility.html הצהרת נגישות
  privacy.html       מדיניות פרטיות
  terms.html         תקנון ותנאי שימוש
  404.html
  _headers           כותרות אבטחה (Cloudflare Pages / Netlify)
  assets/css|js|img|fonts
build.mjs            בנייה: מקטין HTML/CSS, מקטין ומערבל JS, מוסיף cache-busting
dist/                התוצר המוכן להעלאה (נוצר ב־npm run build)
```

## פקודות

```bash
npm install
npm run build      # בונה את dist/
npm run serve      # תצוגה מקומית של dist/ בכתובת http://localhost:8080
```

## מה צריך להשלים

- **קישור לפרופיל במדרג** – בקובץ `src/assets/js/main.js`, משתנה `MIDRAG_URL` (כרגע מפנה לחיפוש בגוגל).
- **המלצות אמיתיות** – אפשר להוסיף ציטוטים ממדרג באזור "לקוחות ממליצים" (יש סגנון מוכן: `.quotes` / `.quote`). רק המלצות שלקוחות כתבו בפועל.
- **קישור לפייסבוק** – אם רוצים, להוסיף בפוטר.
- **דומיין** – הכתובת `one-handasa.com` מופיעה ב־canonical, sitemap ו־robots. לעדכן אם הדומיין שונה.

## אבטחה

- Content-Security-Policy קשיח (`'self'` בלבד), בלי סקריפטים או סגנונות inline, בלי טפסים, בלי עוגיות ובלי שירותי צד שלישי.
- גופנים ותמונות מאוחסנים מקומית.
- `_headers` מוסיף HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy ועוד (בשירותי אחסון שתומכים בזה).
- קוד ה־JS בתוצר מוקטן ומעורבל. שימו לב: בכל אתר, הקוד שמגיע לדפדפן גלוי למבקר. כדי שקוד המקור עצמו לא יהיה פומבי, צריך להפוך את המאגר בגיטהאב לפרטי.

## אחסון חינמי מומלץ: Cloudflare Pages

1. להפוך את המאגר לפרטי (Settings → General → Danger Zone → Change visibility).
2. להירשם ל־Cloudflare (חינם) → Workers & Pages → Create → Pages → Connect to Git → לבחור את המאגר.
3. הגדרות בנייה: Build command `npm run build`, Build output directory `dist`.
4. לחבר את הדומיין (Custom domains). תעודת SSL ניתנת אוטומטית וחינם.

קובץ `_headers` נקרא אוטומטית ומפעיל את כותרות האבטחה.

## חלופה: GitHub Pages (מאגר ציבורי)

Settings → Pages → Source: **GitHub Actions**. הקובץ `.github/workflows/pages.yml` בונה ומפרסם את האתר בכל push.
