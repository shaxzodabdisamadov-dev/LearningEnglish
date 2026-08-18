# LearningEnglishStat — Lug'at va o'qish orqali ingliz tilini o'rganish sayti

Statik sayt (HTML/CSS/JS, build kerak emas, framework yo'q). A1 dan C1 gacha 5 ta level, har birida 30 ta bo'lim (har birida 20 ta so'z + o'qish matni + tushunish savollari), va har level oxirida shu levelning o'zlashtirilishini tekshiradigan test.

## Bo'limlar qanday ochiladi

**Barcha levellar (A1–C1) boshidanoq ochiq** — foydalanuvchi istalgan levelga, istalgan tartibda kirishi mumkin.

Har bir level ichida esa 30 ta bo'lim **ketma-ket** ochiladi: 1-bo'lim doim ochiq, 2-bo'lim faqat 1-bo'limni kamida 70% natija bilan tugatgandan keyin ochiladi, 3-bo'lim — 2-bo'limdan keyin, va hokazo. Bu mantiq har bir level uchun mustaqil ishlaydi. Bo'lim testidan o'tmasdan keyingi bo'limga havola orqali ham, to'g'ridan-to'g'ri URL orqali ham o'tib bo'lmaydi — sayt "🔒 Bu bo'lim hali yopiq" xabarini ko'rsatadi.

Level oxiridagi **level testi** boshqacha ishlaydi: u hech narsani ochmaydi, faqat shu levelni qanchalik o'zlashtirganingizni tekshiradi. Kamida 80% to'g'ri javob bersangiz, level "✅ topshirilgan" deb belgilanadi — bu shunchaki natija, keyingi levelga o'tish uchun shart emas.

## Vercelga bepul joylash

1. [vercel.com](https://vercel.com) da bepul akkaunt oching (GitHub bilan kirish qulay).
2. Bu papkani GitHub'ga yuklang (yangi repository yarating va shu papkadagi fayllarni push qiling), YOKI Vercel dashboard'da "Add New Project" tugmasini bosib, papkani to'g'ridan-to'g'ri yuklang (drag & drop / import).
3. Framework sifatida "Other" ni tanlang — build buyrug'i shart emas, chunki bu statik sayt.
4. "Deploy" tugmasini bosing. Bir necha soniyada sayt tayyor bo'ladi va sizga bepul `.vercel.app` domeni beriladi.
5. Deploy bo'lgach, `robots.txt` va `sitemap.xml` fayllaridagi `your-domain.vercel.app` o'rniga haqiqiy domeningizni yozib qo'ying.

### GitHub orqali (tavsiya etiladi)

```
git init
git add .
git commit -m "LearningEnglishStat vocabulary site"
git branch -M main
git remote add origin <sizning-repo-url>
git push -u origin main
```

Keyin Vercel dashboard'da "Import Project" orqali shu repository'ni tanlang — avtomatik joylashtiradi va har safar push qilganingizda yangilanadi.

`vercel.json`da `cleanUrls: true` yoqilgan, shuning uchun sayt ichidagi barcha havolalar kengaytmasiz (`/`, `/level?level=a1`, `/section?level=a1&id=3`, `/test?level=a1`) yozilgan — bu ortiqcha 308 redirect bo'lishining oldini oladi. Shu bilan birga cache va xavfsizlik header'lari ham sozlangan: CSS/JS uzoq muddat (versiya raqami `?v=` bilan), `data/*.json` qisqa muddat, HTML sahifalar esa har doim yangilanadi (`no-cache`).

## Loyiha tuzilishi

- `index.html` — Bosh sahifa (umumiy progress, levellar, progress eksport/import/tozalash)
- `level.html` — Bitta levelning 30 ta bo'limi va level testi
- `section.html` — Bo'lim: so'zlar (ta'rif + talaffuz + ovozli o'qish), o'qish matni, tushunish savollari
- `test.html` — Level bo'yicha o'zlashtirish testi
- `404.html` — Topilmagan sahifalar uchun
- `data/levels.json` — Levellar ro'yxati va metama'lumot
- `data/<level>/index.json` — Shu levelning bo'limlari haqida metama'lumot (mavzu, so'zlar/savollar soni)
- `data/<level>/<01..30>.json` — Har bir bo'limning to'liq kontenti (faqat ochilganda yuklanadi)
- `data/<level>/test.json` — Level testi savollari
- `scripts/split-data.mjs` — Eski, bitta faylli level JSON'larni yuqoridagi tuzilmaga o'tkazgan bir martalik migratsiya skripti (`node scripts/split-data.mjs`)
- `scripts/dev-server.py` — Lokal test uchun kichik server (Node shart emas), Vercel'ning `cleanUrls` xatti-harakatini takrorlaydi
- `css/style.css`, `js/app.js` — Dizayn va mantiq
- `manifest.json`, `sw.js` — PWA: ilova sifatida o'rnatish va internetsiz ochilish
- `robots.txt`, `sitemap.xml` — Qidiruv tizimlari uchun

## Ma'lumot yuklash

Har bir bo'lim sahifasi butun levelni emas, faqat o'sha bitta bo'lim faylini (`data/<level>/<NN>.json`, odatda 10–15 KB) yuklaydi. Sessiya davomida bir xil fayl ikki marta yuklanmasligi uchun natijalar xotirada keshlanadi. Internet uzilib, ma'lumot yuklanmasa, sahifa jim qolmaydi — "Ma'lumotni yuklab bo'lmadi..." xabari va "Qayta urinish" tugmasi chiqadi.

## Progress qanday saqlanadi

Foydalanuvchi progressi brauzerning `localStorage`'ida (`wordpath:v1:progress` kaliti ostida, versiya raqami bilan) saqlanadi — server yoki baza kerak emas. Bo'limni kamida 70% to'g'ri javob bilan tugatsa — bo'lim "bajarildi" deb belgilanadi. Buzilgan yoki eski formatdagi ma'lumot o'qilsa, ilova qulab tushmaydi — standart bo'sh holatga qaytadi.

Bosh sahifada uchta tugma bor:

- **Progressni saqlash (JSON)** — progressni fayl sifatida yuklab oladi.
- **Progressni yuklash (JSON)** — avval saqlangan faylni import qiladi (boshqa brauzer yoki qurilmaga o'tkazish uchun).
- **Progressni tozalash** — barcha progressni o'chiradi (tasdiqlash so'raladi).

## Talaffuz (pronunciation) va o'zbekcha tarjima

Har bir so'z uchun IPA transkripsiya yozilgan, va 🔊 tugmasi bosilganda brauzerning o'z ovozli o'qish funksiyasi (Web Speech API) orqali so'z ingliz tilida talaffuz qilinadi. Ingliz ovozi (en-US yoki en-GB) avtomatik tanlanadi; agar brauzeringizda ingliz ovozi topilmasa, sahifada ogohlantirish ko'rsatiladi. Uzun o'qish matni gaplarga bo'lib, navbat bilan o'qiladi (ba'zi brauzerlar uzun matnni o'rtada to'xtatib qo'yishining oldini olish uchun). Boshqa bo'limga o'tganda yoki sahifadan chiqqanda ovoz avtomatik to'xtaydi. Tanlagan tezligingiz (0.5x–1.5x) brauzeringizda eslab qolinadi.

Har bir so'z kartasida inglizcha ta'rifdan tashqari **o'zbekcha tarjimasi** ham ko'rsatiladi, oldida O'zbekiston bayrog'i tasviri bilan (SVG rasm).

### Audio boshqaruvi: to'xtatish va tezlik

O'qish matnini "🔊 Matnni tinglash" tugmasi orqali tinglayotganda, **"⏹ To'xtatish" tugmasi** har doim mavjud. Shuningdek, **tezlik tanlagich** bor (0.5x, 0.75x, 1x, 1.25x, 1.5x).

## Vizual bezaklar (bo'lim mavzusiga mos rasmlar)

Har bir bo'lim, level va dashboard kartochkasida **mavzuga mos emoji-bezak** avtomatik tanlanadi (masalan, "Family and Daily Life" mavzusi uchun 👨‍👩‍👧‍👦, sport mavzusi uchun ⚽ va h.k.). Bu tashqi rasm yuklamasdan, faqat matn asosida ishlaydi.

## Internetsiz ishlash (PWA)

Sayt Progressive Web App sifatida sozlangan (`manifest.json` + `sw.js`). Birinchi tashrifingizdan so'ng, brauzer asosiy sahifa, dizayn, kod va levellar ro'yxatini keshga saqlaydi — shundan keyin internetsiz ham sayt ochiladi. Avval ochilgan bo'lim va test sahifalari ham keshda qoladi va keyinchalik internetsiz qayta ko'rish mumkin; hali ochilmagan bo'limlar tabiiy ravishda internet talab qiladi. Kesh versiyasi `sw.js` ichidagi `CACHE_VERSION` orqali boshqariladi — sayt yangilanganda bu raqam oshirilsa, brauzer eski keshni avtomatik tozalab, yangisini yuklaydi. Mobil qurilmada brauzer menyusidan "Add to Home Screen" orqali ilova sifatida o'rnatish ham mumkin.

## Lokal ishga tushirish

Bu sayt `fetch()` orqali JSON fayllarni yuklaydi, shuning uchun uni to'g'ridan-to'g'ri `file://` orqali (papkadagi `index.html`ni ikki marta bosib, yoki VS Code'ning oddiy fayl ochish orqali) ochib bo'lmaydi — brauzer xavfsizlik siyosati bunday so'rovlarni bloklaydi va sahifa butunlay bo'sh ko'rinadi. Static server orqali ochish shart.

**Muammo: VS Code'ning "Live Server" kengaytmasi ham to'liq ishlamaydi.** U bosh sahifani ochadi, lekin `/level?level=a1` kabi toza havolalarga (`vercel.json`dagi `cleanUrls` sozlamasi tufayli ishlatiladigan) 404 qaytaradi, chunki Live Server bu qoidani (extenzsiyasiz yo'l → `.html` fayl) tushunmaydi. Shuning uchun level/bo'lim/test sahifalariga o'tishda sayt "ishlamayapti"dek tuyuladi.

**Tavsiya etiladigan yechim** — repo ichida shu maqsad uchun tayyor, faqat Python standart kutubxonasidan foydalanadigan kichik dev-server bor (Node/npm shart emas):

```
python scripts/dev-server.py
```

so'ng brauzerda `http://localhost:8000` ni oching. Bu server Vercel'ning `cleanUrls` xatti-harakatini aynan takrorlaydi — barcha toza havolalar (`/`, `/level?level=a1`, `/section?level=a1&id=3`, `/test?level=a1`) va `404.html` to'g'ri ishlaydi.

Agar kompyuteringizda Node.js o'rnatilgan bo'lsa, muqobil sifatida `npx serve` yoki `vercel dev` ham xuddi shunday ishlaydi (ikkalasi ham cleanUrls'ni tushunadi). Oddiy `python -m http.server` esa **ishlatmang** — u toza havolalarni hal qila olmaydi.
