import type { TourStepDef } from "@/lib/tours/types";

export const purchasesSteps: TourStepDef[] = [
  {
    target: "nav-purchases",
    side: "right",
    text: {
      en: { title: "Purchases", description: "Record what you buy from suppliers and track what you still owe them." },
      hi: { title: "परचेज़", description: "आप सप्लायर से जो खरीदते हैं वह यहाँ दर्ज करें और उन पर बकाया राशि पर नज़र रखें।" },
      gu: { title: "પરચેઝ", description: "તમે સપ્લાયર પાસેથી જે ખરીદો છો તે અહીં નોંધો અને તેમના પર બાકી રકમ પર નજર રાખો." },
    },
  },
  {
    target: "purchases-actions",
    side: "bottom",
    align: "end",
    text: {
      en: {
        title: "Record a purchase or a payment",
        description: "New purchase logs the transaction; Record payment logs what you paid the supplier — the outstanding balance updates automatically.",
      },
      hi: {
        title: "परचेज़ या पेमेंट दर्ज करें",
        description: "'New purchase' लेन-देन दर्ज करता है; 'Record payment' सप्लायर को दिया गया भुगतान दर्ज करता है — बकाया राशि अपने आप अपडेट होती है।",
      },
      gu: {
        title: "પરચેઝ કે પેમેન્ટ નોંધો",
        description: "'New purchase' વ્યવહાર નોંધે છે; 'Record payment' સપ્લાયરને કરેલી ચુકવણી નોંધે છે — બાકી રકમ આપમેળે અપડેટ થાય છે.",
      },
    },
  },
  {
    target: "purchases-tabs",
    side: "bottom",
    text: {
      en: { title: "Entries, Payments, Outstanding", description: "Same pattern as Sales — switch between purchases, payments made, and outstanding per supplier." },
      hi: { title: "एंट्री, पेमेंट, बकाया", description: "सेल्स जैसा ही पैटर्न — परचेज़, किए गए भुगतान, और हर सप्लायर के बकाया के बीच स्विच करें।" },
      gu: { title: "એન્ટ્રી, પેમેન્ટ, બાકી", description: "સેલ્સ જેવી જ પદ્ધતિ — પરચેઝ, કરેલી ચુકવણીઓ, અને દરેક સપ્લાયરની બાકી રકમ વચ્ચે સ્વિચ કરો." },
    },
  },
  {
    target: "purchases-table",
    side: "top",
    text: {
      en: { title: "Purchase entries", description: "Each row is one purchase — supplier, item, quantity, rate, and total." },
      hi: { title: "परचेज़ एंट्री", description: "हर पंक्ति एक खरीद है — सप्लायर, आइटम, मात्रा, दर, और कुल राशि।" },
      gu: { title: "પરચેઝ એન્ટ્રી", description: "દરેક પંક્તિ એક ખરીદી છે — સપ્લાયર, વસ્તુ, જથ્થો, દર, અને કુલ રકમ." },
    },
  },
];
