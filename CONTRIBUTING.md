# راهنمای مشارکت در پروژه | Contributing Guide

<div dir="rtl">

## 🤝 خوش آمدید!

از علاقه شما به مشارکت در **SETI@Portalgraph** متشکریم! این راهنما به شما کمک می‌کند تا به بهترین شکل در پروژه مشارکت کنید.

## 📋 فهرست مطالب

- [کد رفتار](#کد-رفتار)
- [چگونه مشارکت کنم؟](#چگونه-مشارکت-کنم)
- [گزارش باگ](#گزارش-باگ)
- [پیشنهاد ویژگی](#پیشنهاد-ویژگی)
- [ارسال Pull Request](#ارسال-pull-request)
- [استانداردهای کد](#استانداردهای-کد)

---

## 📜 کد رفتار

- با احترام با دیگران رفتار کنید
- از زبان مناسب استفاده کنید
- پذیرای نظرات سازنده باشید
- روی بهبود پروژه تمرکز کنید

---

## 🚀 چگونه مشارکت کنم؟

### 1. Fork کردن

```bash
# ابتدا پروژه را Fork کنید (از طریق GitHub)
# سپس کلون کنید
git clone https://github.com/YOUR-USERNAME/seti-portalgraph.git
cd seti-portalgraph
```

### 2. ساخت Branch

```bash
# برای ویژگی جدید
git checkout -b feature/my-new-feature

# برای رفع باگ
git checkout -b fix/bug-description

# برای مستندات
git checkout -b docs/update-readme
```

### 3. نصب وابستگی‌ها

```bash
npm install
npm run dev
```

### 4. اعمال تغییرات

کدتان را بنویسید و تست کنید.

### 5. Commit کردن

```bash
git add .
git commit -m "feat: add awesome feature"
```

#### قالب پیام Commit:

```
<type>: <description>

[optional body]

[optional footer]
```

**انواع type:**
- `feat`: ویژگی جدید
- `fix`: رفع باگ
- `docs`: تغییر مستندات
- `style`: تغییرات ظاهری (فرمت، سمی‌کالن و...)
- `refactor`: بازنویسی کد
- `test`: افزودن تست
- `chore`: کارهای نگهداری

### 6. Push و Pull Request

```bash
git push origin feature/my-new-feature
```

سپس از GitHub یک Pull Request باز کنید.

---

## 🐛 گزارش باگ

هنگام گزارش باگ، این اطلاعات را ارائه دهید:

1. **عنوان واضح**: خلاصه مشکل
2. **مراحل بازتولید**: قدم به قدم
3. **رفتار مورد انتظار**: چه باید اتفاق بیفتد
4. **رفتار فعلی**: چه اتفاقی می‌افتد
5. **محیط**: مرورگر، سیستم‌عامل، نسخه
6. **اسکرین‌شات**: در صورت امکان

### قالب Issue:

```markdown
## توضیح باگ
[توضیح مختصر]

## مراحل بازتولید
1. برو به '...'
2. کلیک روی '...'
3. مشاهده خطا

## رفتار مورد انتظار
[توضیح]

## اسکرین‌شات
[تصویر]

## محیط
- مرورگر: Chrome 120
- سیستم‌عامل: Windows 11
- دستگاه: دسکتاپ
```

---

## 💡 پیشنهاد ویژگی

برای پیشنهاد ویژگی جدید:

1. ابتدا Issues موجود را بررسی کنید
2. یک Issue جدید با برچسب `enhancement` باز کنید
3. ویژگی را با جزئیات توضیح دهید
4. مزایا و کاربردها را بیان کنید

---

## 📝 استانداردهای کد

### TypeScript/React

```typescript
// ✅ خوب
const MyComponent: React.FC<Props> = ({ name, value }) => {
  const [state, setState] = useState<string>('');
  
  return (
    <div className="container">
      <h1>{name}</h1>
    </div>
  );
};

// ❌ بد
function myComponent(props) {
  var state = '';
  return <div><h1>{props.name}</h1></div>
}
```

### نام‌گذاری

- **کامپوننت‌ها**: PascalCase (`MyComponent.tsx`)
- **فانکشن‌ها**: camelCase (`handleClick`)
- **ثابت‌ها**: UPPER_SNAKE_CASE (`MAX_SIZE`)
- **فایل‌ها**: kebab-case یا PascalCase

### ساختار فایل

```typescript
// 1. Imports
import React from 'react';
import { useEffect } from 'react';

// 2. Types/Interfaces
interface Props {
  name: string;
}

// 3. Component
const MyComponent: React.FC<Props> = ({ name }) => {
  // 3.1 Hooks
  const [state, setState] = useState('');
  
  // 3.2 Effects
  useEffect(() => {}, []);
  
  // 3.3 Handlers
  const handleClick = () => {};
  
  // 3.4 Render
  return <div>{name}</div>;
};

// 4. Export
export default MyComponent;
```

---

## ✅ چک‌لیست Pull Request

قبل از ارسال PR، مطمئن شوید:

- [ ] کد بدون خطا بیلد می‌شود (`npm run build`)
- [ ] تست‌ها پاس می‌شوند (اگر وجود دارد)
- [ ] کد فرمت شده است
- [ ] مستندات آپدیت شده است
- [ ] Commit message‌ها واضح هستند
- [ ] Branch از آخرین `main` ساخته شده

---

## 🙏 تشکر

از وقتی که برای مشارکت می‌گذارید متشکریم! هر مشارکتی، از رفع یک typo تا افزودن ویژگی بزرگ، ارزشمند است.

</div>

---

# English Version

## 🤝 Welcome!

Thank you for your interest in contributing to **SETI@Portalgraph**!

### Quick Start

1. Fork the repository
2. Clone your fork
3. Create a branch
4. Make changes
5. Push and create a PR

### Code Style

- Use TypeScript
- Follow React best practices
- Write meaningful commit messages
- Keep code clean and documented

---

Made with ❤️ by the SETI@Portalgraph community
