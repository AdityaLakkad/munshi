import type { TourStepDef } from "@/lib/tours/types";

export const dashboardSteps: TourStepDef[] = [
  {
    target: "nav-dashboard",
    side: "right",
    text: {
      en: { title: "Your Dashboard", description: "Every time you log in, you land here. It gives you today's cash position at a glance." },
      hi: { title: "आपका डैशबोर्ड", description: "लॉगिन करते ही आप यहीं पहुँचते हैं। यहाँ आपको आज की नकद स्थिति एक नज़र में दिखती है।" },
      gu: { title: "તમારું ડેશબોર્ડ", description: "લોગિન કરતાં જ તમે અહીં પહોંચો છો. અહીં તમને આજની રોકડ સ્થિતિ એક નજરમાં દેખાય છે." },
    },
  },
  {
    target: "dashboard-quick-add",
    side: "bottom",
    align: "end",
    text: {
      en: { title: "Quick add", description: "Jump straight into a Credit, Debit, Sale, or Purchase without leaving this page." },
      hi: { title: "क्विक ऐड", description: "इस पेज से बाहर गए बिना सीधे क्रेडिट, डेबिट, सेल या परचेज़ जोड़ें।" },
      gu: { title: "ક્વિક એડ", description: "આ પેજ છોડ્યા વગર સીધા ક્રેડિટ, ડેબિટ, સેલ અથવા પરચેઝ ઉમેરો." },
    },
  },
  {
    target: "dashboard-cards",
    side: "bottom",
    text: {
      en: { title: "Today's numbers", description: "Cash in hand, bank balance, this month's sales and purchases, and what's outstanding on both sides." },
      hi: { title: "आज के आँकड़े", description: "हाथ में नकद, बैंक बैलेंस, इस महीने की बिक्री और खरीद, और दोनों तरफ का बकाया।" },
      gu: { title: "આજના આંકડા", description: "હાથમાં રોકડ, બેંક બેલેન્સ, આ મહિનાનું વેચાણ અને ખરીદી, અને બંને બાજુની બાકી રકમ." },
    },
  },
  {
    target: "dashboard-recent",
    side: "top",
    text: {
      en: { title: "Recent transactions", description: "The last entries from every module — CashBook, Sales, Purchases, and Salary — in one list." },
      hi: { title: "हाल के लेन-देन", description: "कैशबुक, सेल्स, परचेज़ और सैलरी — सभी मॉड्यूल की नवीनतम एंट्री एक ही सूची में।" },
      gu: { title: "તાજેતરના વ્યવહારો", description: "કેશબુક, સેલ્સ, પરચેઝ અને સેલેરી — બધા મોડ્યુલની તાજેતરની એન્ટ્રીઓ એક જ યાદીમાં." },
    },
  },
];
