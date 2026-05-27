import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';

  const items = ar
    ? [
        { q: 'ما هو صراحة؟', a: 'موقع يسمح لأصحابك بإرسال رسائل لك بدون أن يظهر اسمهم.' },
        { q: 'كيف أبدأ؟', a: 'اضغط "إنشاء حساب"، اختر اسم مستخدم، شارك رابطك، وانتظر الرسائل.' },
        { q: 'هل الرسائل مجهولة فعلًا؟', a: 'نعم، لا يظهر للمستلم اسم الراسل أبدًا. لكننا نسجل هوية المرسل داخليًا لمنع الإساءة.' },
        { q: 'كيف أوقف استقبال الرسائل؟', a: 'من الإعدادات → "السماح باستقبال رسائل".' },
        { q: 'كيف أحذف حسابي؟', a: 'من الإعدادات → "منطقة خطر" → "حذف الحساب".' },
      ]
    : [
        { q: 'What is Sarahah?', a: 'A site that lets your friends send you messages without revealing their name.' },
        { q: 'How do I start?', a: 'Click "Sign up", pick a username, share your link, and wait for messages.' },
        { q: 'Are messages truly anonymous?', a: 'Senders are never shown to recipients. We do record sender identity internally to prevent abuse.' },
        { q: 'How do I stop receiving messages?', a: 'Settings → uncheck "Allow people to send me messages".' },
        { q: 'How do I delete my account?', a: 'Settings → Danger zone → Delete account.' },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900">{t('legal.helpTitle')}</h1>
      <div className="mt-6 space-y-3">
        {items.map((it, i) => (
          <details key={i} className="card p-5 group">
            <summary className="cursor-pointer font-bold text-slate-900 list-none flex items-center justify-between">
              {it.q}
              <span className="text-brand-600 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="mt-3 text-slate-600 leading-relaxed">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
