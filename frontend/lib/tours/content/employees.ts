import type { TourStepDef } from "@/lib/tours/types";

export const employeesSteps: TourStepDef[] = [
  {
    target: "nav-employees",
    side: "right",
    text: {
      en: { title: "Employees", description: "Manage your team and run payroll from here." },
      hi: { title: "एम्प्लॉयीज़", description: "अपनी टीम प्रबंधित करें और यहीं से सैलरी चलाएँ।" },
      gu: { title: "એમ્પ્લોયીઝ", description: "તમારી ટીમનું સંચાલન કરો અને અહીંથી જ પગાર ચલાવો." },
    },
  },
  {
    target: "employees-actions",
    side: "bottom",
    align: "end",
    text: {
      en: {
        title: "Add, pay, or advance",
        description: "Add a new employee, pay a month's salary, or give an advance — both post to the CashBook automatically as outflows.",
      },
      hi: {
        title: "जोड़ें, भुगतान करें, या एडवांस दें",
        description: "नया कर्मचारी जोड़ें, महीने की सैलरी दें, या एडवांस दें — दोनों अपने आप कैशबुक में आउटफ़्लो के रूप में दर्ज होते हैं।",
      },
      gu: {
        title: "ઉમેરો, ચૂકવો, અથવા એડવાન્સ આપો",
        description: "નવો કર્મચારી ઉમેરો, મહિનાનો પગાર આપો, અથવા એડવાન્સ આપો — બંને આપમેળે કેશબુકમાં આઉટફ્લો તરીકે નોંધાય છે.",
      },
    },
  },
  {
    target: "employees-tabs",
    side: "bottom",
    text: {
      en: { title: "Employees, Salary, Advance salary", description: "Switch between your team list, the salary payment history, and advances given." },
      hi: { title: "एम्प्लॉयीज़, सैलरी, एडवांस सैलरी", description: "अपनी टीम की सूची, सैलरी भुगतान इतिहास, और दिए गए एडवांस के बीच स्विच करें।" },
      gu: { title: "એમ્પ્લોયીઝ, સેલેરી, એડવાન્સ સેલેરી", description: "તમારી ટીમની યાદી, પગાર ચુકવણીનો ઇતિહાસ, અને આપેલા એડવાન્સ વચ્ચે સ્વિચ કરો." },
    },
  },
  {
    target: "employees-search",
    side: "bottom",
    text: {
      en: { title: "Find an employee", description: "Search by name to narrow a long team list." },
      hi: { title: "कर्मचारी खोजें", description: "लंबी टीम सूची को नाम से खोजकर छोटा करें।" },
      gu: { title: "કર્મચારી શોધો", description: "લાંબી ટીમ યાદીને નામથી શોધીને ટૂંકી કરો." },
    },
  },
  {
    target: "employees-table",
    side: "top",
    text: {
      en: { title: "Your team", description: "Click Ledger next to any employee to see their full salary and advance history in one place." },
      hi: { title: "आपकी टीम", description: "किसी भी कर्मचारी के आगे 'Ledger' पर क्लिक करके उसका पूरा सैलरी और एडवांस इतिहास एक जगह देखें।" },
      gu: { title: "તમારી ટીમ", description: "કોઈપણ કર્મચારીની બાજુમાં 'Ledger' પર ક્લિક કરી તેનો સંપૂર્ણ પગાર અને એડવાન્સ ઇતિહાસ એક જ જગ્યાએ જુઓ." },
    },
  },
];
