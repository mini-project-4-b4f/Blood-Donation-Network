import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Language = 'en' | 'ar';

const translations: Record<string, { en: string; ar: string }> = {
  'Skip to content': { en: 'Skip to content', ar: 'تخطي إلى المحتوى' },
  'Main navigation': { en: 'Main navigation', ar: 'القائمة الرئيسية' },
  'SOS Board': { en: 'SOS Board', ar: 'طلبات التبرع العاجلة' },
  'My Dashboard': { en: 'My Dashboard', ar: 'لوحة التحكم' },
  'My Profile': { en: 'My Profile', ar: 'ملفي الشخصي' },
  'Manage Requests': { en: 'Manage Requests', ar: 'إدارة الطلبات' },
  'Sign In': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'Become a Donor': { en: 'Become a Donor', ar: 'كن متبرعاً' },
  'Donor': { en: 'Donor', ar: 'متبرع' },
  'Coordinator': { en: 'Coordinator', ar: 'منسق' },
  'Sign Out': { en: 'Sign Out', ar: 'تسجيل الخروج' },
  'Arabic': { en: 'Arabic', ar: 'العربية' },
  'English': { en: 'English', ar: 'English' },
  'Connecting volunteer donors with hospitals that need them.': { en: 'Connecting volunteer donors with hospitals that need them.', ar: 'نربط المتبرعين المتطوعين بالمستشفيات التي تحتاج إليهم.' },
  'Donation eligibility is confirmed by qualified healthcare staff before every donation.': { en: 'Donation eligibility is confirmed by qualified healthcare staff before every donation.', ar: 'يتم التأكد من أهلية التبرع من قبل مختصين صحيين قبل كل عملية تبرع.' },
  'YOUR COMMUNITY. YOUR CHANCE TO HELP.': { en: 'YOUR COMMUNITY. YOUR CHANCE TO HELP.', ar: 'مجتمعك، وفرصتك لتقديم المساعدة.' },
  'Someone needs blood.': { en: 'Someone needs blood.', ar: 'هناك من يحتاج إلى الدم.' },
  'You could be their hope.': { en: 'You could be their hope.', ar: 'يمكنك أن تكون أملهم.' },
  'When a patient needs blood urgently, find the right donors in the right area — fast. A simple pledge can be the start of something life-changing.': { en: 'When a patient needs blood urgently, find the right donors in the right area — fast. A simple pledge can be the start of something life-changing.', ar: 'عندما يحتاج مريض إلى الدم بشكل عاجل، ساعد في العثور على المتبرعين المناسبين في المنطقة المناسبة بسرعة. قد يكون تعهدك بداية لإنقاذ حياة.' },
  'Go to My Dashboard': { en: 'Go to My Dashboard', ar: 'الانتقال إلى لوحة التحكم' },
  'PUBLIC SOS BOARD': { en: 'PUBLIC SOS BOARD', ar: 'لوحة طلبات التبرع العامة' },
  'Blood needed, hope shared.': { en: 'Blood needed, hope shared.', ar: 'قطرة دم تمنح الأمل.' },
  'Open requests from hospitals and blood banks, with the most urgent first.': { en: 'Open requests from hospitals and blood banks, with the most urgent first.', ar: 'الطلبات المفتوحة من المستشفيات وبنوك الدم، مرتبة حسب درجة الاستعجال.' },
  'Refresh requests': { en: 'Refresh requests', ar: 'تحديث الطلبات' },
  'Loading blood requests…': { en: 'Loading blood requests…', ar: 'جارٍ تحميل طلبات التبرع...' },
  'No active SOS blood requests right now.': { en: 'No active SOS blood requests right now.', ar: 'لا توجد طلبات تبرع عاجلة حالياً.' },
  'All current hospital needs have been met.': { en: 'All current hospital needs have been met.', ar: 'تمت تلبية جميع احتياجات المستشفيات الحالية.' },
  'Join the donor community': { en: 'Join the donor community', ar: 'انضم إلى مجتمع المتبرعين' },
  'You don\'t have to wait for an emergency to make a difference.': { en: 'You don\'t have to wait for an emergency to make a difference.', ar: 'لا تنتظر حدوث حالة طارئة حتى تصنع فرقاً.' },
  'Join the network today and be ready when your community needs you.': { en: 'Join the network today and be ready when your community needs you.', ar: 'انضم إلى الشبكة اليوم وكن مستعداً عندما يحتاج إليك مجتمعك.' },
  'A COMMUNITY THAT CARES': { en: 'A COMMUNITY THAT CARES', ar: 'مجتمع يهتم بالآخرين' },
  'A little of you.': { en: 'A little of you.', ar: 'القليل منك.' },
  'A lifeline for someone.': { en: 'A lifeline for someone.', ar: 'قد يكون طوق نجاة لشخص آخر.' },
  'Every connection brings a hospital one step closer to the blood it needs. Thank you for being part of it.': { en: 'Every connection brings a hospital one step closer to the blood it needs. Thank you for being part of it.', ar: 'كل تواصل يقرّب المستشفى خطوة من الحصول على الدم الذي يحتاجه. شكراً لكونك جزءاً من هذه المبادرة.' },
  'Your next act of kindness starts here.': { en: 'Your next act of kindness starts here.', ar: 'خطوتك التالية في فعل الخير تبدأ من هنا.' },
  'WELCOME BACK': { en: 'WELCOME BACK', ar: 'أهلاً بعودتك' },
  'Sign in to your account': { en: 'Sign in to your account', ar: 'سجّل الدخول إلى حسابك' },
  'For volunteer donors and blood-bank coordinators.': { en: 'For volunteer donors and blood-bank coordinators.', ar: 'للمتبرعين المتطوعين ومنسقي بنوك الدم.' },
  'Phone number or email': { en: 'Phone number or email', ar: 'رقم الهاتف أو البريد الإلكتروني' },
  'Password': { en: 'Password', ar: 'كلمة المرور' },
  'New to the network?': { en: 'New to the network?', ar: 'جديد في الشبكة؟' },
  'Become a donor': { en: 'Become a donor', ar: 'انضم كمتبرع' },
  'Back to the SOS board': { en: 'Back to the SOS board', ar: 'العودة إلى طلبات التبرع' },
  'BE SOMEONE\'S LIFELINE': { en: 'BE SOMEONE\'S LIFELINE', ar: 'كن سبباً في إنقاذ حياة' },
  'Join a community that gives.': { en: 'Join a community that gives.', ar: 'انضم إلى مجتمع يمنح الحياة.' },
  'Create your donor account. When a hospital needs your help, find the requests you can respond to.': { en: 'Create your donor account. When a hospital needs your help, find the requests you can respond to.', ar: 'أنشئ حساب المتبرع الخاص بك، وتعرّف على الطلبات التي يمكنك تلبيتها عندما يحتاج المستشفى إلى مساعدتك.' },
  'A few details to help connect you with your community.': { en: 'A few details to help connect you with your community.', ar: 'بعض المعلومات لمساعدتك على التواصل مع مجتمعك.' },
  'Full name': { en: 'Full name', ar: 'الاسم الكامل' },
  'Phone number': { en: 'Phone number', ar: 'رقم الهاتف' },
  'Email (optional)': { en: 'Email (optional)', ar: 'البريد الإلكتروني (اختياري)' },
  'At least 8 characters.': { en: 'At least 8 characters.', ar: '8 محارف على الأقل.' },
  'Blood type': { en: 'Blood type', ar: 'فصيلة الدم' },
  'Select your blood type': { en: 'Select your blood type', ar: 'اختر فصيلة دمك' },
  'Area': { en: 'Area', ar: 'المنطقة' },
  'Select your area': { en: 'Select your area', ar: 'اختر منطقتك' },
  'Loading supported areas…': { en: 'Loading supported areas…', ar: 'جارٍ تحميل المناطق المتاحة...' },
  'No supported areas are available right now.': { en: 'No supported areas are available right now.', ar: 'لا توجد مناطق متاحة حالياً.' },
  'Your contact details are never shown on the public SOS board.': { en: 'Your contact details are never shown on the public SOS board.', ar: 'لن تظهر معلومات الاتصال الخاصة بك على لوحة طلبات التبرع العامة.' },
  'Create Donor Account': { en: 'Create Donor Account', ar: 'إنشاء حساب متبرع' },
  'Already part of the network?': { en: 'Already part of the network?', ar: 'هل أنت عضو بالفعل؟' },
  'Sign in': { en: 'Sign in', ar: 'تسجيل الدخول' },
  'Try again': { en: 'Try again', ar: 'إعادة المحاولة' },
  'Donor Dashboard': { en: 'Donor Dashboard', ar: 'لوحة تحكم المتبرع' },
  'Donor Profile': { en: 'Donor Profile', ar: 'الملف الشخصي للمتبرع' },
  'Request management': { en: 'Request management', ar: 'إدارة الطلبات' },
  'Blood bank coordinator dashboard': { en: 'Blood bank coordinator dashboard', ar: 'لوحة تحكم منسق بنك الدم' },
  'Track blood requests and find eligible donors.': { en: 'Track blood requests and find eligible donors.', ar: 'تابع طلبات الدم واعثر على المتبرعين المؤهلين.' },
  'Create SOS request': { en: 'Create SOS request', ar: 'إنشاء طلب تبرع عاجل' },
  'Request details': { en: 'Request details', ar: 'تفاصيل الطلب' },
  'Eligible Donors': { en: 'Eligible Donors', ar: 'المتبرعون المؤهلون' },
};

interface LanguageContextValue {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
}
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return window.localStorage.getItem('bdn-language') === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { window.localStorage.setItem('bdn-language', next); } catch { /* Storage may be unavailable. */ }
  };

  const direction = language === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    direction,
    setLanguage,
    t: (text: string) => translations[text]?.[language] ?? text,
  }), [language, direction]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
