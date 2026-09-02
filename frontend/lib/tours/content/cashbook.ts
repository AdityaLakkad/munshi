import type { TourStepDef } from "@/lib/tours/types";

export const cashbookSteps: TourStepDef[] = [
  {
    target: "nav-cashbook",
    side: "right",
    text: {
      en: {
        title: "CashBook",
        description:
          "Every cash-in and cash-out that isn't already tied to a sale, purchase or salary is logged here — it's the single source of truth for your cash position.",
      },
      hi: {
        title: "कैशबुक",
        description:
          "जो भी नकद लेन-देन किसी सेल, परचेज़ या सैलरी से नहीं जुड़ा है, वह यहीं दर्ज होता है — यह आपकी नकद स्थिति का एकमात्र सटीक स्रोत है।",
      },
      gu: {
        title: "કેશબુક",
        description:
          "જે પણ રોકડ વ્યવહાર કોઈ સેલ, પરચેઝ કે સેલેરી સાથે જોડાયેલો નથી, તે અહીં નોંધાય છે — આ તમારી રોકડ સ્થિતિનો એકમાત્ર સાચો સ્ત્રોત છે.",
      },
    },
  },
  {
    target: "cashbook-actions",
    side: "bottom",
    align: "end",
    text: {
      en: {
        title: "Credit, Debit, Transfer",
        description: "Add a Credit (money in) or Debit (money out), or Transfer between Cash, Bank and UPI. Export the ledger to CSV any time.",
      },
      hi: {
        title: "क्रेडिट, डेबिट, ट्रांसफर",
        description: "क्रेडिट (पैसा आया) या डेबिट (पैसा गया) जोड़ें, या कैश, बैंक और UPI के बीच ट्रांसफर करें। लेजर को कभी भी CSV में एक्सपोर्ट करें।",
      },
      gu: {
        title: "ક્રેડિટ, ડેબિટ, ટ્રાન્સફર",
        description: "ક્રેડિટ (પૈસા આવ્યા) અથવા ડેબિટ (પૈસા ગયા) ઉમેરો, અથવા કેશ, બેંક અને UPI વચ્ચે ટ્રાન્સફર કરો. ગમે ત્યારે લેજરને CSV માં એક્સપોર્ટ કરો.",
      },
    },
  },
  {
    target: "cashbook-filters",
    side: "bottom",
    text: {
      en: { title: "Filter the ledger", description: "Narrow the list to a date range or a specific entry type before you export or review." },
      hi: { title: "लेजर फ़िल्टर करें", description: "एक्सपोर्ट या समीक्षा से पहले सूची को किसी तारीख की सीमा या खास एंट्री टाइप तक सीमित करें।" },
      gu: { title: "લેજર ફિલ્ટર કરો", description: "એક્સપોર્ટ કે સમીક્ષા પહેલાં યાદીને કોઈ તારીખ મર્યાદા અથવા ચોક્કસ એન્ટ્રી પ્રકાર સુધી મર્યાદિત કરો." },
    },
  },
  {
    target: "cashbook-table",
    side: "top",
    text: {
      en: { title: "The ledger", description: "Every entry shows its running balance, so you always know where cash stood after each transaction." },
      hi: { title: "लेजर", description: "हर एंट्री के साथ रनिंग बैलेंस दिखता है, ताकि हर लेन-देन के बाद नकद स्थिति हमेशा पता रहे।" },
      gu: { title: "લેજર", description: "દરેક એન્ટ્રી સાથે રનિંગ બેલેન્સ દેખાય છે, જેથી દરેક વ્યવહાર પછી રોકડ સ્થિતિ હંમેશા ખબર રહે." },
    },
  },
];
