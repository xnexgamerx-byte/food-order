# نشر الموقع على Render

## الخطوات (5 دقائق فقط)

### 1. رفع الكود على GitHub
1. افتح **github.com** وأنشئ حساباً مجانياً إذا لم يكن لديك
2. أنشئ Repository جديد (New Repository) → اسمه مثلاً `food-order`
3. في Replit، افتح **Shell** وشغّل:
   ```
   git remote add origin https://github.com/اسمك/food-order.git
   git push -u origin main
   ```

### 2. إنشاء الخدمات على Render
1. افتح **render.com** وأنشئ حساباً مجانياً
2. اضغط **New** → اختر **Blueprint**
3. اربط حساب GitHub الخاص بك
4. اختر الـ Repository الذي أنشأته
5. سيكتشف Render ملف `render.yaml` تلقائياً ويُنشئ:
   - 🟢 Web Service (السيرفر + الواجهة)
   - 🗄️ PostgreSQL Database

### 3. إضافة قاعدة البيانات
بعد النشر الأول، شغّل هذا الأمر مرة واحدة لإنشاء الجداول:
- في لوحة Render → اضغط على الخدمة → **Shell**
- شغّل: `node -e "import('./artifacts/api-server/dist/index.mjs')"`

أو استخدم متغير البيئة `DATABASE_URL` لتشغيل الـ migrations.

### 4. متغيرات البيئة المطلوبة
Render يضيفها تلقائياً من `render.yaml`:
- `DATABASE_URL` — يُضاف تلقائياً من قاعدة البيانات
- `NODE_ENV=production`
- `PORT=10000`
- `SESSION_SECRET` — يُولَّد تلقائياً

## الرابط النهائي
بعد النشر، موقعك سيكون على:
`https://food-order-app.onrender.com`

## ملاحظات
- الخطة المجانية تُوقف الموقع بعد 15 دقيقة من عدم الاستخدام (يستغرق ~30 ثانية للإيقاظ)
- للحصول على موقع دائم التشغيل، اشترك بخطة **$7/شهر**
