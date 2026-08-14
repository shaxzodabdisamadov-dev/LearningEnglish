# WordPath — Lug'at va o'qish orqali ingliz tilini o'rganish sayti

Statik sayt (HTML/CSS/JS, build kerak emas). A1 dan C1 gacha 5 ta level, har birida 30 ta bo'lim (har birida 20 ta so'z + o'qish matni + 6 ta tushunish savoli), va har level oxirida shu levelning o'zlashtirilishini tekshiradigan test. **Barcha levellar (A1–C1) boshidanoq ochiq** — foydalanuvchi istalgan levelga, istalgan tartibda kirishi mumkin, oldingi levelning testini topshirish shart emas.

## Vercelga bepul joylash

1. [vercel.com](https://vercel.com) da bepul akkaunt oching (GitHub bilan kirish qulay).
2. Bu papkani GitHub'ga yuklang (yangi repository yarating va shu papkadagi fayllarni push qiling), YOKI Vercel dashboard'da "Add New Project" tugmasini bosib, papkani to'g'ridan-to'g'ri yuklang (drag & drop / import).
3. Framework sifatida "Other" ni tanlang — build buyrug'i shart emas, chunki bu statik sayt.
4. "Deploy" tugmasini bosing. Bir necha soniyada sayt tayyor bo'ladi va sizga bepul `.vercel.app` domeni beriladi.

### GitHub orqali (tavsiya etiladi)

```
git init
git add .
git commit -m "WordPath vocabulary site"
git branch -M main
git remote add origin <sizning-repo-url>
git push -u origin main
```

Keyin Vercel dashboard'da "Import Project" orqali shu repository'ni tanlang — avtomatik joylashtiradi va har safar push qilganingizda yangilanadi.

## Loyiha tuzilishi

- `index.html` — Bosh sahifa (umumiy progress va levellar)
- `level.html` — Bitta levelning 30 ta bo'limi va level testi
- `section.html` — Bo'lim: 20 so'z (ta'rif + talaffuz + ovozli o'qish), o'qish matni, 6 ta savol
- `test.html` — Keyingi levelga o'tish testi
- `data/levels.json` — Levellar ro'yxati va metama'lumot
- `data/a1.json`, `data/a2.json`, `data/b1.json`, `data/b2.json`, `data/c1.json` — Har bir levelning to'liq kontenti
- `css/style.css`, `js/app.js` — Dizayn va mantiq

## Progress qanday saqlanadi

Foydalanuvchi progressi brauzerning `localStorage`'ida saqlanadi (server yoki baza kerak emas). Bo'limni kamida 70% to'g'ri javob bilan tugatsa — bo'lim "bajarildi" deb belgilanadi. Level testini kamida 80% bilan topshirsa — o'sha level "test topshirilgan" deb belgilanadi (bu shunchaki o'zlashtirishni tasdiqlaydi; keyingi levelga o'tish uchun shart emas, chunki barcha levellar boshidanoq ochiq).

## Bo'limlar qanday ochiladi

Har bir level ichida 30 ta bo'lim **ketma-ket** ochiladi: 1-bo'lim doim ochiq, 2-bo'lim faqat 1-bo'limni kamida 70% natija bilan tugatgandan keyin ochiladi, 3-bo'lim — 2-bo'limdan keyin, va hokazo. Bu mantiq har bir level uchun mustaqil ishlaydi (masalan, B2 levelda 1–5 bo'limni tugatsangiz, ular doim ochiq turadi va istalgan vaqtda qayta ko'rib chiqishingiz mumkin; 6-bo'lim esa 5-bo'lim tugatilgunga qadar yopiq bo'ladi). Bo'lim testidan o'tmasdan keyingi bo'limga havola orqali ham, to'g'ridan-to'g'ri URL orqali ham o'tib bo'lmaydi — sayt "🔒 Bu bo'lim hali yopiq" xabarini ko'rsatadi.

## Talaffuz (pronunciation) va o'zbekcha tarjima

Har bir so'z uchun IPA transkripsiya yozilgan, va 🔊 tugmasi bosilganda brauzerning o'z ovozli o'qish funksiyasi (Web Speech API) orqali so'z ingliz tilida talaffuz qilinadi — qo'shimcha audio fayl yoki server kerak emas. Bundan tashqari, har bir so'z kartasida inglizcha ta'rifdan tashqari **o'zbekcha tarjimasi** ham ko'rsatiladi, oldida O'zbekiston bayrog'i tasviri bilan (SVG rasm, emoji emas — shuning uchun har qanday qurilmada to'g'ri ko'rinadi).

### Audio boshqaruvi: to'xtatish va tezlik

O'qish matnini "🔊 Matnni tinglash" tugmasi orqali tinglayotganda, endi **"⏹ To'xtatish" tugmasi** har doim mavjud — istalgan vaqtda ovozni to'xtatish mumkin (bu matn tinglashda ham, alohida so'zni tinglashda ham ishlaydi). Shuningdek, **tezlik tanlagich** qo'shildi (0.5x, 0.75x, 1x, 1.25x, 1.5x) — sekinroq yoki tezroq talaffuzni tanlash mumkin.

## Vizual bezaklar (bo'lim mavzusiga mos rasmlar)

Sayt krativligini oshirish uchun har bir bo'lim, level va dashboard kartochkasida **mavzuga mos emoji-bezak** avtomatik tanlanadi (masalan, "Family and Daily Life" mavzusi uchun 👨‍👩‍👧‍👦, sport mavzusi uchun ⚽ va h.k.) — bo'lim sahifasida katta fon bezagi sifatida, level sahifasidagi bo'lim kartochkalarida kichik belgi sifatida, va dashboard'dagi level kartochkalarida ham ko'rinadi. Bu tashqi rasm yuklamasdan, faqat matn asosida ishlaydi — shu sababli tezkor va offline'da ham ishlaydi.
# LearningEnglish
