// Build: src/pages + src/partials -> dist/ (minified, obfuscated JS) and dist-artifact/ (Claude preview)
import { readFile, writeFile, rm, cp, readdir, stat, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { transform } from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const SRC = 'src';
const OUT = 'dist';
const OUT_ART = 'dist-artifact';
const SITE = 'https://one-handasa.com/';

/* ---------------- content data ---------------- */
const NAV = [
  ['home', 'index.html', 'בית'],
  ['about', 'about.html', 'אודות'],
  ['why', 'about.html#why', 'למה לבחור בנו'],
  ['services', 'services.html', 'תחומי התמחות'],
  ['inspection', 'home-inspection.html', 'בדק בית'],
  ['certs', 'certificates.html', 'הסמכות ותעודות'],
  ['contact', 'contact.html', 'צור קשר']
];

const SERVICES = [
  { id: 'new-apartment', title: 'בדק בית לדירה חדשה', img: 'svc-inspection', alt: 'סלון בדירה חדשה ומוארת',
    short: 'בדיקה מול המפרט, התוכניות והתקנים, לפני קבלת המפתח מהקבלן.',
    long: 'קיבלתם הודעה על מסירה? זה הזמן לבדוק. בודקים את הדירה מול מפרט המכר, התוכניות והתקנים, ומתעדים כל ליקוי בדוח שאפשר להעביר לקבלן לתיקון.',
    items: ['התאמה למפרט ולתוכניות', 'ריצוף, חיפוי, טיח וצבע', 'רטיבות, איטום ובדיקת הצפה', 'אלומיניום, חלונות ודלתות', 'אינסטלציה וחשמל', 'מעקות ובטיחות'] },
  { id: 'second-hand', title: 'בדק בית לדירה יד 2', img: 'svc-defects', alt: 'קיר חשוף בזמן שיפוץ',
    short: 'איתור רטיבות, סדקים וליקויים נסתרים לפני שחותמים על החוזה.',
    long: 'בדירה יד 2 הבעיות לא תמיד גלויות, והמוכר לא תמיד יודע עליהן. בדיקה לפני החתימה מראה לכם מה באמת קונים ונותנת בסיס למשא ומתן על המחיר.',
    items: ['רטיבות ונזילות נסתרות, עם מצלמה תרמית', 'סדקים וסימני תזוזה במבנה', 'מצב הצנרת, עם מצלמת צנרת', 'חשמל ולוח חשמל', 'אומדן עלויות תיקון למשא ומתן'] },
  { id: 'common-property', title: 'רכוש משותף', img: 'common-building', alt: 'בניין מגורים רב קומות',
    short: 'לובי, חניון, גג ומערכות משותפות, עם תיעוד מסודר לכל ליקוי.',
    long: 'לנציגויות בתים ולוועדי דיירים: בדיקה של השטחים והמערכות המשותפות בבניין, לפני קבלת הבניין מהקבלן או כשמתגלות בעיות.',
    items: ['גגות ואיטום', 'לובי, חדרי מדרגות וחניונים', 'מערכות משותפות', 'בטיחות ונגישות', 'דוח מסודר מול הקבלן'] },
  { id: 'expert-opinion', title: 'חוות דעת הנדסית ומשפטית', img: 'svc-legal', alt: 'חתימה על מסמך',
    short: 'חוות דעת קבילה בבית משפט, כולל אומדן עלויות תיקון והפניה לתקנים.',
    long: 'כשיש מחלוקת על ליקויים, צריך חוות דעת מומחה שתעמוד בבית המשפט. חוות הדעת נכתבת לפי הדרישות, עם ממצאים מתועדים, הפניה לתקנים ואומדן עלויות.',
    items: ['חוות דעת לפי דרישות בית המשפט', 'תיעוד ממצאים בתמונות ובמדידות', 'הפניה לתקנים ולמפרט', 'אומדן עלויות תיקון', 'חוות דעת לנזקי הדף מלחימה מול מס רכוש', 'עדות בבית המשפט במידת הצורך'] },
  { id: 'court-expert', title: 'מומחה מטעם בית המשפט', img: 'svc-court', alt: 'ספרייה משפטית',
    short: 'חוות דעת מומחה בסכסוכים בין יזמים, קבלנים ודיירים, וליווי עורכי דין.',
    long: 'דוד משמש מומחה מטעם בתי המשפט בסכסוכי בנייה. הבדיקה נעשית באופן מקצועי ואובייקטיבי, ומשמשת את בית המשפט ואת הצדדים בהכרעה.',
    items: ['מינוי כמומחה בסכסוכי בנייה', 'בדיקה אובייקטיבית בין הצדדים', 'ליווי מקצועי לעורכי דין', 'חוות דעת ברורה ומנומקת'] },
  { id: 'supervision', title: 'פיקוח בנייה וניהול פרויקטים', img: 'svc-supervision', alt: 'אנשי מקצוע עם קסדות באתר בנייה',
    short: 'פיקוח הנדסי צמוד, בקרת איכות, לוחות זמנים ותקציב, עד המסירה.',
    long: 'בונים בית או מנהלים פרויקט? פיקוח צמוד מטעמכם מוודא שהעבודה מתבצעת לפי התוכניות, המפרט והתקנים, ושהתקציב ולוחות הזמנים נשמרים.',
    items: ['פיקוח צמוד על הביצוע', 'בקרת איכות ותיאום מערכות', 'בדיקת חשבונות וכתבי כמויות', 'מעקב לוחות זמנים ותקציב', 'ליווי עד מסירה ותעודת גמר'] },
  { id: 'structure', title: 'אישורי קונסטרוקציה', img: 'svc-structure', alt: 'ברזל זיון ועבודות שלד מלמעלה',
    short: 'בדיקה ואישור הנדסי לאלמנטים ולמבנים, בהתאם לדרישות ולתקנים.',
    long: 'בדיקה הנדסית ואישור קונסטרוקטיבי לאלמנטים ולמבנים, לפי דרישת רשויות, מזמינים או חברות ביטוח.',
    items: ['בדיקת אלמנטים ומבנים קיימים', 'אישור הנדסי לפי דרישה', 'ליווי מול רשויות ומזמינים'] },
  { id: 'safety', title: 'שירותי בטיחות', img: 'svc-safety', alt: 'עובדים עם ציוד מגן על פיגום',
    short: 'מנהל עבודה, ממונה בטיחות ומדריך עבודה בגובה, לאתרי בנייה ולעסקים.',
    long: 'שירותי בטיחות לאתרי בנייה ולעסקים, על ידי מנהל עבודה מוסמך, ממונה בטיחות בעל אישור כשירות בתוקף ומדריך עבודה בגובה.',
    items: ['מנהל עבודה בבנייה ובתשתיות', 'ממונה בטיחות', 'הדרכת עבודה בגובה', 'ליווי בטיחות באתר'] },
  { id: 'licensing', title: 'רישוי בנייה', img: 'svc-licensing', alt: 'עבודה על תוכניות בנייה',
    short: 'אישורי תחילת עבודות, הפקת טופס 4 וליווי מול ועדות התכנון והבנייה.',
    long: 'ניסיון כמפקח בוועדה מקומית לתכנון ובנייה עוזר לקדם את תהליך הרישוי בצורה מסודרת, מאישור תחילת עבודות ועד תעודת גמר.',
    items: ['אישורי תחילת עבודות', 'הפקת טופס 4 ותעודת גמר', 'ליווי מול ועדות תכנון ובנייה', 'בדיקת תוכניות'] }
];

const EXTRA = {
  'new-apartment': { more: 'הבדיקה מתבצעת לפני המסירה או בתחילת תקופת הבדק, כך שהקבלן מחויב לתקן את הליקויים לפי חוק המכר (דירות). הדוח כולל תמונות, הפניה לתקן ואומדן עלות לכל ליקוי.', who: ['רוכשי דירה חדשה מקבלן', 'לפני מסירת מפתח', 'בתקופת הבדק והאחריות'] },
  'second-hand': { more: 'הממצאים עוזרים להחליט אם להמשיך בעסקה, לנהל משא ומתן על המחיר או לבקש מהמוכר לתקן לפני החתימה.', who: ['רוכשי דירה או בית יד 2', 'לפני חתימה על חוזה', 'משקיעים בנדל"ן'] },
  'common-property': { more: 'הדוח מסודר לפי אזורים ומערכות, ומאפשר לנציגות לנהל מול הקבלן או חברת הניהול דרישה מסודרת לתיקון.', who: ['נציגויות בתים', 'ועדי דיירים בבניין חדש', 'חברות ניהול'] },
  'expert-opinion': { more: 'חוות הדעת מתאימה להגשה במסגרת תביעה או כבסיס למשא ומתן לפני הליך משפטי, והיא כתובה בשפה ברורה גם למי שאינו איש מקצוע.', who: ['דיירים מול קבלן או יזם', 'עורכי דין בתיקי ליקויי בנייה', 'קונים ומוכרים בסכסוך'] },
  'court-expert': { more: 'הניסיון בביצוע, בפיקוח ובבדיקה מאפשר לבחון כל טענה לגופה, ולהציג לבית המשפט תמונה הנדסית מלאה ומבוססת.', who: ['בתי משפט', 'עורכי דין', 'צדדים בגישור או בבוררות'] },
  'supervision': { more: 'הפיקוח כולל ביקורים קבועים באתר, דיווח מסודר ועבודה מול הקבלן והיועצים, כדי לתפוס בעיות כשעוד קל וזול לתקן אותן.', who: ['בונים בית פרטי', 'יזמים ומזמיני עבודה', 'גופים ציבוריים'] },
  'structure': { more: 'האישור ניתן אחרי בדיקה בשטח ובחינה של האלמנט או המבנה, בהתאם לדרישות של הגורם המבקש.', who: ['בעלי נכסים ועסקים', 'קבלנים ומזמיני עבודה', 'לפי דרישת רשות או ביטוח'] },
  'safety': { more: 'השירות מתאים לאתרי בנייה, לעבודות שיפוץ ולעסקים שנדרשים לעמוד בתקנות הבטיחות בעבודה.', who: ['קבלנים ואתרי בנייה', 'עסקים ומפעלים', 'עבודות בגובה'] },
  'licensing': { more: 'היכרות עם הדרישות של הוועדות ועם שלבי התהליך חוסכת זמן, פניות חוזרות ועיכובים.', who: ['בעלי בתים שבונים או מרחיבים', 'יזמים וקבלנים', 'בעלי עסקים'] }
};
for (const s of SERVICES) Object.assign(s, EXTRA[s.id], { page: `service-${s.id}.html` });

const QUALS = [
  ['קונסטרוקטור – הנדסה אזרחית', 'הנדסאי בניין רשום, מגמת תכנון קונסטרוקציה.'],
  ['מומחה בדק בית וכתיבת חוות דעת משפטית', 'הסמכות איגוד המהנדסים לבנייה ולתשתיות.'],
  ['מנהל עבודה בבנייה ותשתיות', 'מוסמך מטעם מינהל הבטיחות והבריאות התעסוקתית.'],
  ['ממונה בטיחות', 'אישור כשירות בתוקף מטעם משרד העבודה.'],
  ['מדריך מוסמך לעבודה בגובה', 'הדרכת עובדים לעבודה בטוחה בגובה.'],
  ["קבלן רשום ג'-100 בנייה ותשתיות", 'רשום בפנקס הקבלנים בענף הבנייה.']
];

const CERTS = [
  ['court-expert-opinion', 775, 1100, 'חוות דעת ועדות בהליכים משפטיים', 'איגוד המהנדסים והמכון לאמנויות המשפט'],
  ['building-quality-inspector', 771, 1100, 'בוחן איכות מבנים וכתיבת חוות דעת', 'איגוד המהנדסים לבנייה ולתשתיות'],
  ['technician-registration', 777, 1100, 'תעודת רישום הנדסאי', 'הנדסה אזרחית, מגמת מבנים'],
  ['safety-officer', 778, 1100, 'אישור כשירות – ממונה על הבטיחות', 'משרד העבודה, מינהל הבטיחות'],
  ['safety-officer-course', 1100, 776, 'קורס ממונים על הבטיחות בעבודה', '316 שעות לימוד'],
  ['site-manager-safety', 774, 1100, 'מנהל עבודה – בנייה ובנייה הנדסית', 'מבחן בטיחות בעבודות בנייה'],
  ['height-work-instructor', 850, 1100, 'מדריך עבודה בגובה', 'קורס מדריכים כללי']
];

/* ---------------- render helpers ---------------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
const serviceCards = SERVICES.map((s) => `      <a class="svc reveal" href="${s.page}">
        <div class="svc__img"><img src="assets/img/photos/${s.img}.webp" width="900" height="600" alt="${esc(s.alt)}" loading="lazy"></div>
        <div class="svc__cap"><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p><span class="svc__go">לפרטים${arrow}</span></div>
      </a>`).join('\n');
const serviceIndex = SERVICES.map((s) => `      <a href="#${s.id}">${esc(s.title)}</a>`).join('\n');
const serviceDetails = SERVICES.map((s) => `    <article class="svc-detail reveal" id="${s.id}">
      <div class="svc-detail__media"><img src="assets/img/photos/${s.img}.webp" width="900" height="600" alt="${esc(s.alt)}" loading="lazy"></div>
      <div class="svc-detail__copy">
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.long)}</p>
        <ul class="checks checks--2">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        <div class="btn-row"><a class="btn btn--wa btn--sm js-wa" data-wa="${esc(s.title)}" href="https://wa.me/972509737244" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-wa"/></svg>לפרטים בוואטסאפ</a></div>
      </div>
    </article>`).join('\n');
const waBtn = (topic, label = 'לפרטים בוואטסאפ', cls = 'btn btn--wa js-wa') => `<a class="${cls}" data-wa="${esc(topic)}" href="https://wa.me/972509737244" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-wa"/></svg>${label}</a>`;
function servicePage(s) {
  const idx = SERVICES.indexOf(s);
  const rel = [SERVICES[(idx + 1) % 9], SERVICES[(idx + 2) % 9], SERVICES[(idx + 3) % 9]];
  return `<!--page ${JSON.stringify({ title: s.title, desc: s.short + ' א.ח.ד הנדסת בניין ובטיחות – 050-9737244.', nav: 'services', path: s.page })}-->
<section class="banner">
  <div class="banner__bg" aria-hidden="true"><img src="assets/img/photos/${s.img}.webp" width="900" height="600" alt=""></div>
  <div class="wrap">
    <ol class="crumbs" aria-label="מיקום באתר"><li><a href="index.html">בית</a></li><li><a href="services.html">תחומי התמחות</a></li><li aria-current="page">${esc(s.title)}</li></ol>
    <h1>${esc(s.title)}</h1>
    <p>${esc(s.short)}</p>
  </div>
</section>

<section class="section">
  <div class="wrap svc-page">
    <article class="svc-page__main">
      <img src="assets/img/photos/${s.img}.webp" width="900" height="600" alt="${esc(s.alt)}">
      <h2>על השירות</h2>
      <p>${esc(s.long)}</p>
      <p>${esc(s.more)}</p>
      <h2>מה כולל השירות</h2>
      <ul class="checks checks--2">${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>למי זה מתאים</h2>
      <ul class="who">${s.who.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <div class="btn-row">${waBtn(s.title, 'שליחת הודעה בוואטסאפ')}<a class="btn btn--outline" href="tel:+972509737244"><svg aria-hidden="true"><use href="#i-phone"/></svg><span dir="ltr">050-9737244</span></a></div>
    </article>
    <aside class="side" aria-label="מידע נוסף">
      <div class="side-card side-card--contact">
        <h3>רוצים לתאם?</h3>
        <p>שלחו הודעה עם סוג הנכס ומיקומו, ותקבלו הצעת מחיר נוחה ללא התחייבות.</p>
        ${waBtn(s.title, 'וואטסאפ')}
        <a class="btn btn--outline" href="tel:+972509737244"><svg aria-hidden="true"><use href="#i-phone"/></svg>חיוג</a>
      </div>
      <div class="side-card">
        <h3>תחומי התמחות</h3>
        <ul class="side-list">${SERVICES.map((o) => `<li><a href="${o.page}"${o.id === s.id ? ' aria-current="page"' : ''}>${esc(o.title)}${arrow}</a></li>`).join('')}</ul>
      </div>
    </aside>
  </div>
</section>

<section class="section section--sand" aria-labelledby="how-title">
  <div class="wrap">
    <div class="heading"><h2 id="how-title">איך זה עובד?</h2></div>
    <ol class="steps">
      <li class="step reveal"><h3>שולחים הודעה</h3><p>בוואטסאפ או בטלפון, עם פרטי הנכס והצורך.</p></li>
      <li class="step reveal"><h3>מתאמים</h3><p>מקבלים הצעת מחיר ברורה ומועד שנוח לכם.</p></li>
      <li class="step reveal"><h3>בדיקה בשטח</h3><p>עבודה יסודית עם מכשור מתקדם.</p></li>
      <li class="step reveal"><h3>דוח וליווי</h3><p>דוח מסודר וליווי עד הסוף.</p></li>
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="rel-title">
  <div class="wrap">
    <div class="heading heading--center"><h2 id="rel-title">שירותים נוספים</h2></div>
    <div class="svc-grid">
${rel.map((o) => `      <a class="svc reveal" href="${o.page}">
        <div class="svc__img"><img src="assets/img/photos/${o.img}.webp" width="900" height="600" alt="${esc(o.alt)}" loading="lazy"></div>
        <div class="svc__cap"><h3>${esc(o.title)}</h3><p>${esc(o.short)}</p><span class="svc__go">לפרטים${arrow}</span></div>
      </a>`).join('\n')}
    </div>
  </div>
</section>

{{cta}}
`;
}
const quals = `    <ul class="quals">\n${QUALS.map(([t, d]) => `      <li class="qual reveal"><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n')}\n    </ul>`;
const certItem = ([f, w, h, t, sub]) => `      <li class="cert reveal"><button class="cert__btn" type="button" data-full="assets/img/certs/${f}.webp" aria-label="הגדלת התעודה: ${esc(t)}"><img src="assets/img/certs/${f}.webp" width="${w}" height="${h}" alt="" loading="lazy" draggable="false"><span class="cert__zoom" aria-hidden="true"><svg><use href="#i-zoom"/></svg></span></button><b>${esc(t)}</b><span>${esc(sub)}</span></li>`;
const certsAll = CERTS.map(certItem).join('\n');
const certsTeaser = CERTS.slice(0, 4).map(certItem).join('\n');

const navItems = (active) => NAV.map(([k, href, label]) => `        <li><a href="${href}"${k === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n');
const menuItems = (active) => NAV.map(([k, href, label]) => `    <li><a href="${href}"${k === active ? ' aria-current="page"' : ''}>${label}${arrow}</a></li>`).join('\n');
const footerNav = NAV.filter(([k]) => k !== 'home').map(([, href, label]) => `          <li><a href="${href}">${label}</a></li>`).join('\n');

const LD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: 'א.ח.ד הנדסת בניין ובטיחות', alternateName: 'א.ח.ד הנדסה ובטיחות', description: 'בדק בית, איתור ליקויי בנייה, חוות דעת הנדסית ומשפטית, מומחה מטעם בתי משפט, אישורי קונסטרוקציה ושירותי בטיחות.', telephone: '+972-50-973-7244', url: SITE, image: SITE + 'assets/img/og-image.jpg', founder: { '@type': 'Person', name: "דוד חי אברג'ל" }, address: { '@type': 'PostalAddress', addressLocality: 'שדרות', addressCountry: 'IL' }, areaServed: 'IL' });

function head(m) {
  const title = m.fullTitle ? m.title : `${m.title} | א.ח.ד הנדסת בניין ובטיחות`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; connect-src 'self'; frame-src https://www.facebook.com; object-src 'none'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="description" content="${esc(m.desc)}">
${m.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${m.path}">`}
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(m.desc)}">
<meta property="og:image" content="${SITE}assets/img/og-image.jpg">
<link rel="icon" href="assets/img/icon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/img/icon-180.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/heebo-hebrew.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/assistant-hebrew.woff2" as="font" type="font/woff2" crossorigin>
${m.preload ? `<link rel="preload" href="${m.preload}" as="image">` : ''}
<link rel="stylesheet" href="assets/css/main.css">
${m.ld ? `<script type="application/ld+json">${LD}</script>` : ''}
<script src="assets/js/main.js" defer></script>
</head>
<body>`;
}

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);

/* ---------------- build ---------------- */
await rm(OUT, { recursive: true, force: true });
await rm(OUT_ART, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(`${SRC}/assets`, `${OUT}/assets`, { recursive: true });
for (const f of ['_headers', 'robots.txt', 'sitemap.xml', 'site.webmanifest', '.nojekyll']) {
  try { await cp(`${SRC}/${f}`, `${OUT}/${f}`); } catch { /* optional */ }
}

const css = (await transform(await readFile(`${SRC}/assets/css/main.css`, 'utf8'), { loader: 'css', minify: true, legalComments: 'none' })).code;
await writeFile(`${OUT}/assets/css/main.css`, css);
const jsMin = (await transform(await readFile(`${SRC}/assets/js/main.js`, 'utf8'), { loader: 'js', minify: true, target: 'es2017', legalComments: 'none' })).code;
const js = JavaScriptObfuscator.obfuscate(jsMin, {
  compact: true, controlFlowFlattening: false, deadCodeInjection: false, identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, selfDefending: false, stringArray: true, stringArrayEncoding: ['base64'], stringArrayThreshold: 0.75,
  stringArrayRotate: true, stringArrayShuffle: true, splitStrings: true, splitStringsChunkLength: 8, transformObjectKeys: false, unicodeEscapeSequence: false
}).getObfuscatedCode();
await writeFile(`${OUT}/assets/js/main.js`, js);
const v = hash(css + js);


/* ---------------- Midrag + Facebook (from src/site-config.json) ---------------- */
const CFG = JSON.parse(await readFile(`${SRC}/site-config.json`, 'utf8'));
const MIDRAG_FALLBACK = 'https://www.google.com/search?q=' + encodeURIComponent("א.ח.ד דוד חי אברג'ל מדרג");
const midragHref = CFG.midragUrl || MIDRAG_FALLBACK;
const realReviews = (CFG.reviews || []).filter((r) => r && r.text && r.name);
const star5 = '<svg><use href="#i-star"/></svg>'.repeat(5);
const reviewsHtml = `<section class="section reviews-lux" aria-labelledby="reviews-title">
  <div class="wrap">
    <div class="reviews reveal">
      <div>
        ${CFG.midragRating ? `<div class="rating-badge"><strong>${esc(CFG.midragRating)}</strong><span>דירוג במדרג${CFG.midragReviewCount ? ` · ${esc(CFG.midragReviewCount)} חוות דעת` : ''}</span></div>` : `<div class="stars" aria-hidden="true">${star5}</div>`}
        <h2 id="reviews-title">לקוחות ממליצים</h2>
        <p>לקוחות רבים המליצו על א.ח.ד באתר מדרג, אחרי בדק בית וחוות דעת.</p>
        <p class="verified"><svg aria-hidden="true"><use href="#i-check"/></svg>חוות דעת מאומתות של לקוחות אמיתיים באתר מדרג</p>
      </div>
      <a class="btn btn--light" href="${esc(midragHref)}" target="_blank" rel="noopener noreferrer">לכל ההמלצות במדרג${arrow}</a>
    </div>
${realReviews.length ? `    <div class="quotes">
${realReviews.slice(0, 6).map((r) => `      <figure class="quote reveal"><div class="stars" aria-hidden="true">${star5}</div><blockquote>${esc(r.text)}</blockquote><figcaption>${esc(r.name)}${r.service ? ` <span>· ${esc(r.service)}</span>` : ''}${r.date ? ` <span>· ${esc(r.date)}</span>` : ''}</figcaption></figure>`).join('\n')}
    </div>
    <p class="certs-note">ההמלצות מתוך <a href="${esc(midragHref)}" target="_blank" rel="noopener noreferrer">הפרופיל של א.ח.ד במדרג</a>.</p>` : ''}
  </div>
</section>`;
const fb = CFG.facebookUrl;
const fbPosts = (CFG.facebookPosts || []).filter((x) => x && x.text);
const fbPara = (t) => t.split('\n').map((l) => l.startsWith('✔') ? `<li>${esc(l.replace(/^✔\s*/, ''))}</li>` : `<p>${esc(l)}</p>`).join('').replace(/(<li>.*?<\/li>)+/g, (m) => `<ul>${m}</ul>`);
const facebookHtml = fb ? `<section class="section fb-lux" aria-labelledby="fb-title">
  <div class="wrap">
    <div class="fb-head reveal">
      <div class="heading"><h2 id="fb-title">מהשטח, בפייסבוק</h2><p>עדכונים, טיפים מקצועיים ובדיקות מהשטח מעמוד הפייסבוק של א.ח.ד.</p></div>
      <a class="btn btn--fb" href="${esc(fb)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-fb"/></svg>לעמוד הפייסבוק</a>
    </div>
${fbPosts.length ? `    <div class="fb-posts">
${fbPosts.slice(0, 3).map((x) => `      <article class="fb-post reveal">
        <header class="fb-post__head"><img src="assets/img/logo-emblem-dark-sm.webp" width="158" height="180" alt=""><div><b>א.ח.ד - הנדסה ובטיחות</b><span>${esc(x.date)}${x.topic ? ` · ${esc(x.topic)}` : ''}</span></div><svg class="fb-post__brand" aria-hidden="true"><use href="#i-fb"/></svg></header>
        <div class="fb-post__body">${fbPara(x.text)}</div>
        <a class="fb-post__more" href="${esc(fb)}" target="_blank" rel="noopener noreferrer">לפוסט המלא בפייסבוק${arrow}</a>
      </article>`).join('\n')}
    </div>` : ''}
    <div class="fb-embed fb-embed--feed reveal" data-page="${esc(fb)}">
      <div class="fb-embed__frame">
        <div class="fb-embed__placeholder">
          <svg aria-hidden="true"><use href="#i-fb"/></svg>
          <button class="btn btn--fb js-fb-load" type="button">הצגת הפיד העדכני מפייסבוק</button>
          <small>לחיצה תטען תוכן מפייסבוק (Meta), בהתאם ל<a href="privacy.html">מדיניות הפרטיות</a>.</small>
        </div>
      </div>
    </div>
  </div>
</section>` : '';
const fbTop = fb ? `      <a href="${esc(fb)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-fb"/></svg>פייסבוק</a>` : '';
const fbFooter = fb ? `          <li><a href="${esc(fb)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-fb"/></svg>עמוד הפייסבוק</a></li>` : '';
const P = {};
for (const n of ['header', 'footer', 'sprite', 'eye', 'cta', 'planner']) P[n] = await readFile(`${SRC}/partials/${n}.html`, 'utf8');

const pages = [];
for (const f of (await readdir(`${SRC}/pages`)).filter((f) => f.endsWith('.html'))) pages.push([f, await readFile(`${SRC}/pages/${f}`, 'utf8')]);
for (const s of SERVICES) pages.push([s.page, servicePage(s)]);
for (const [file, raw] of pages) {
  const m = raw.match(/^<!--page (\{.*?\})-->\n?/);
  if (!m) throw new Error(`missing page meta in ${file}`);
  const meta = JSON.parse(m[1]);
  let body = raw.slice(m[0].length);
  const vars = { eye: P.eye, cta: P.cta, planner: P.planner, serviceCards, serviceIndex, serviceDetails, quals, certsAll, certsTeaser, reviews: reviewsHtml, facebook: facebookHtml };
  body = body.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in vars)) throw new Error(`unknown var ${k} in ${file}`); return vars[k]; });
  const header = P.header.replace('{{sprite}}', P.sprite).replace('{{navItems}}', navItems(meta.nav)).replace('{{menuItems}}', menuItems(meta.nav)).replace('{{fbTop}}', fbTop);
  const footer = P.footer.replace('{{footerNav}}', footerNav).replace('{{fbFooter}}', fbFooter);
  let html = `${head(meta)}\n${header}\n<main id="main" tabindex="-1">\n${body}\n</main>\n${footer}\n</body>\n</html>\n`;
  if (/\{\{\w+\}\}/.test(html)) throw new Error(`unresolved placeholder in ${file}`);
  html = html.replace('assets/css/main.css', `assets/css/main.css?v=${v}`).replace('assets/js/main.js', `assets/js/main.js?v=${v}`);
  const min = await minifyHtml(html, { collapseWhitespace: true, removeComments: true, removeRedundantAttributes: true, removeScriptTypeAttributes: true, useShortDoctype: true });
  await writeFile(`${OUT}/${file}`, min);
}

// Artifact preview copy: index body only (the host wraps it), no meta CSP
await cp(OUT, OUT_ART, { recursive: true });
for (const f of (await walk(OUT_ART)).filter((p) => p.endsWith('.html'))) {
  let html = await readFile(f, 'utf8');
  html = html.replace(/<meta[^>]*http-equiv="?Content-Security-Policy"?[^>]*>/i, '');
  if (path.basename(f) === 'index.html') {
    html = html.replace(/<!doctype html>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '')
      .replace(/<head>/i, '').replace(/<\/head>/i, '').replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '')
      .replace(/<meta[^>]*charset="?utf-8"?[^>]*>/i, '').replace(/<meta[^>]*name="?viewport"?[^>]*>/i, '')
      .replace('</title>', '</title><meta name="claude:viewport-fit-sides" content="cover">');
  }
  await writeFile(f, html);
}
for (const junk of ['_headers', '.nojekyll', 'robots.txt', 'sitemap.xml']) await rm(path.join(OUT_ART, junk), { force: true });
console.log(`built ${pages.length} pages -> ${OUT}/ and ${OUT_ART}/  v=${v}`);
