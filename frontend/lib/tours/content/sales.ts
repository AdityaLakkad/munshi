import type { TourStepDef } from "@/lib/tours/types";

export const salesSteps: TourStepDef[] = [
  {
    target: "nav-sales",
    side: "right",
    text: {
      en: { title: "Sales", description: "Record what you sell and track what each customer still owes you." },
      hi: { title: "सेल्स", description: "आप जो बेचते हैं वह यहाँ दर्ज करें और हर ग्राहक पर बकाया राशि पर नज़र रखें।" },
      gu: { title: "સેલ્સ", description: "તમે જે વેચો છો તે અહીં નોંધો અને દરેક ગ્રાહક પર બાકી રકમ પર નજર રાખો." },
    },
  },
  {
    target: "sales-actions",
    side: "bottom",
    align: "end",
    text: {
      en: {
        title: "Record a sale or a payment",
        description: "New sale logs the transaction; Record payment logs money the customer actually paid — Munshi tracks the difference automatically.",
      },
      hi: {
        title: "सेल या पेमेंट दर्ज करें",
        description: "'New sale' लेन-देन दर्ज करता है; 'Record payment' ग्राहक द्वारा वास्तव में चुकाई गई राशि दर्ज करता है — बाकी बकाया मुंशी खुद हिसाब रखता है।",
      },
      gu: {
        title: "સેલ કે પેમેન્ટ નોંધો",
        description: "'New sale' વ્યવહાર નોંધે છે; 'Record payment' ગ્રાહકે ખરેખર ચૂકવેલી રકમ નોંધે છે — બાકીની રકમનો હિસાબ મુનશી પોતે રાખે છે.",
      },
    },
  },
  {
    target: "sales-tabs",
    side: "bottom",
    text: {
      en: {
        title: "Entries, Payments, Outstanding",
        description: "Switch between every sale you've recorded, every payment received, and a running outstanding balance per customer.",
      },
      hi: {
        title: "एंट्री, पेमेंट, बकाया",
        description: "आपकी दर्ज सभी बिक्री, प्राप्त सभी भुगतान, और हर ग्राहक का चालू बकाया — तीनों के बीच टैब से स्विच करें।",
      },
      gu: {
        title: "એન્ટ્રી, પેમેન્ટ, બાકી",
        description: "તમે નોંધેલા બધા વેચાણ, મળેલા બધા પેમેન્ટ, અને દરેક ગ્રાહકની ચાલુ બાકી રકમ — ત્રણેય વચ્ચે ટેબથી સ્વિચ કરો.",
      },
    },
  },
  {
    target: "sales-table",
    side: "top",
    text: {
      en: { title: "Sales entries", description: "Each row is one sale — customer, item, quantity, rate, and total, calculated for you." },
      hi: { title: "सेल्स एंट्री", description: "हर पंक्ति एक बिक्री है — ग्राहक, आइटम, मात्रा, दर, और कुल राशि, जो अपने आप गणना होती है।" },
      gu: { title: "સેલ્સ એન્ટ્રી", description: "દરેક પંક્તિ એક વેચાણ છે — ગ્રાહક, વસ્તુ, જથ્થો, દર, અને કુલ રકમ, જે આપમેળે ગણાય છે." },
    },
  },
];
