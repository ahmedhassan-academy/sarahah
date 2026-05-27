import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900">{t('legal.privacyTitle')}</h1>
      {ar ? (
        <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
          <p>نحرص على حماية بياناتك. هذه نقاط بسيطة عن كيفية تعاملنا مع المعلومات:</p>
          <ul className="list-disc ps-6 space-y-2">
            <li>نحفظ اسم المستخدم والبريد وكلمة المرور (مشفرة) لتسجيل الدخول.</li>
            <li>الراسل لا يظهر اسمه للمستلم — لكنه مسجل لدينا لمنع إساءة الاستخدام.</li>
            <li>قد نسجل عنوان IP بشكل مشفر لتفعيل حدود معدل الإرسال ومكافحة الإساءة.</li>
            <li>لا نبيع أو نشارك بياناتك مع أي طرف خارجي لأغراض تجارية.</li>
            <li>قد نكشف بياناتك للجهات القضائية فقط عند صدور قرار رسمي.</li>
            <li>يمكنك حذف حسابك في أي وقت من الإعدادات.</li>
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
          <p>We care about your data. Here’s how we handle it:</p>
          <ul className="list-disc ps-6 space-y-2">
            <li>We store your username, email, and a hashed password for authentication.</li>
            <li>Senders are anonymous to recipients, but recorded on our side to prevent abuse.</li>
            <li>We may log IP addresses (hashed) for rate-limiting and abuse prevention.</li>
            <li>We do not sell or share your data with third parties for commercial purposes.</li>
            <li>We may disclose data to authorities only when legally compelled.</li>
            <li>You can delete your account any time from Settings.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
