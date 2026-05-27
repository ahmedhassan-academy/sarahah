import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 prose prose-slate">
      <h1 className="text-2xl font-extrabold">{t('legal.termsTitle')}</h1>
      {ar ? (
        <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
          <p>باستخدامك صراحة فأنت توافق على القواعد التالية:</p>
          <ul className="list-disc ps-6 space-y-2">
            <li>الاحترام شرط أساسي. الرسائل المسيئة أو التهديدية ممنوعة.</li>
            <li>يجب أن يكون عمرك 16 سنة على الأقل لاستخدام الموقع.</li>
            <li>لا يجوز إنشاء حسابات وهمية أو انتحال شخصية الآخرين.</li>
            <li>ممنوع استخدام الموقع لأغراض تجارية أو ترويج منتجات.</li>
            <li>ممنوع جمع بيانات المستخدمين بأي طريقة.</li>
            <li>أي مخالفة قد تؤدي إلى إغلاق الحساب نهائيًا.</li>
          </ul>
          <p>قد يتم تحديث هذه الشروط من وقت لآخر دون إشعار مسبق.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
          <p>By using Sarahah you agree to the following rules:</p>
          <ul className="list-disc ps-6 space-y-2">
            <li>Respect is required. Threats, harassment, and abusive messages are forbidden.</li>
            <li>You must be 16 or older to use the service.</li>
            <li>No impersonation, no fake accounts.</li>
            <li>No commercial use or product promotion.</li>
            <li>No scraping or collecting user data by any means.</li>
            <li>Violations may result in permanent account termination.</li>
          </ul>
          <p>These terms may be updated from time to time without prior notice.</p>
        </div>
      )}
    </div>
  );
}
