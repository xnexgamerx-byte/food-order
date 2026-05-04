# نشر المشروع على Netlify

## الخطوات

### 1. رفع الكود على GitHub
تأكد أن المشروع مرفوع على مستودع GitHub.

### 2. إنشاء موقع جديد على Netlify
1. ادخل على [app.netlify.com](https://app.netlify.com)
2. اضغط **"Add new site" → "Import an existing project"**
3. اختر **GitHub** وحدد المستودع

### 3. إعدادات البناء (Netlify يقرأها تلقائياً من `netlify.toml`)
| الحقل | القيمة |
|-------|--------|
| Build command | `node scripts/build-netlify.mjs` |
| Publish directory | `artifacts/food-order/dist/public` |
| Functions directory | `netlify/functions` |

### 4. متغيرات البيئة (Environment Variables)
اذهب إلى **Site settings → Environment variables** وأضف:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط قاعدة بيانات PostgreSQL (مثل Neon أو Supabase) |
| `ADMIN_PASSWORD` | كلمة مرور لوحة التحكم |
| `SESSION_SECRET` | نص عشوائي طويل للجلسات |

### 5. قاعدة البيانات
Netlify لا يوفر قاعدة بيانات مدمجة. استخدم إحدى هذه الخدمات المجانية:
- **[Neon](https://neon.tech)** ← مجاني ومناسب جداً لـ PostgreSQL
- **[Supabase](https://supabase.com)** ← مجاني مع واجهة إدارة جميلة

بعد إنشاء قاعدة البيانات، انسخ رابط الاتصال (`DATABASE_URL`) وأضفه في Netlify.

### 6. تشغيل الـ Migrations
بعد أول نشر، شغّل الـ migrations على قاعدة بياناتك:
```bash
DATABASE_URL=<رابطك> pnpm --filter @workspace/db run migrate
```

### 7. النشر
اضغط **"Deploy site"** — Netlify سيبني ويرفع تلقائياً.

---

## البنية التقنية على Netlify

```
المستخدم
    ↓
Netlify CDN (الواجهة الأمامية - React)
    ↓ /api/*
Netlify Functions (Express API ← serverless-http)
    ↓
PostgreSQL (Neon / Supabase)
```

## ملاحظات
- كل طلب `/api/*` يُعاد توجيهه تلقائياً إلى الـ serverless function
- باقي الروابط تخدم `index.html` (SPA)
- لوحة التحكم متاحة على `/admin`
