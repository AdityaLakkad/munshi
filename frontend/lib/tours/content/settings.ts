import type { TourStepDef } from "@/lib/tours/types";

export const settingsSteps: TourStepDef[] = [
  {
    target: "nav-settings",
    side: "right",
    text: {
      en: { title: "Settings", description: "Your firm profile, team, and account settings live here." },
      hi: { title: "सेटिंग्स", description: "आपकी फर्म प्रोफ़ाइल, टीम, और अकाउंट सेटिंग्स यहाँ हैं।" },
      gu: { title: "સેટિંગ્સ", description: "તમારી ફર્મ પ્રોફાઇલ, ટીમ, અને એકાઉન્ટ સેટિંગ્સ અહીં છે." },
    },
  },
  {
    target: "settings-firm",
    side: "bottom",
    text: {
      en: { title: "Firm profile", description: "Update your firm's name and currency — shown across the whole app. Only Firm Admins can change this." },
      hi: { title: "फर्म प्रोफ़ाइल", description: "अपनी फर्म का नाम और करेंसी अपडेट करें — यह पूरे ऐप में दिखता है। इसे केवल Firm Admin बदल सकता है।" },
      gu: { title: "ફર્મ પ્રોફાઇલ", description: "તમારી ફર્મનું નામ અને કરન્સી અપડેટ કરો — આ આખી એપમાં દેખાય છે. તેને ફક્ત Firm Admin જ બદલી શકે છે." },
    },
  },
  {
    target: "settings-team",
    side: "bottom",
    text: {
      en: { title: "Team", description: "Add Staff or Viewer accounts. Staff can record entries; Viewers can only look." },
      hi: { title: "टीम", description: "स्टाफ या व्यूअर अकाउंट जोड़ें। स्टाफ एंट्री दर्ज कर सकता है; व्यूअर केवल देख सकता है।" },
      gu: { title: "ટીમ", description: "સ્ટાફ કે વ્યુઅર એકાઉન્ટ ઉમેરો. સ્ટાફ એન્ટ્રી નોંધી શકે છે; વ્યુઅર ફક્ત જોઈ શકે છે." },
    },
  },
  {
    target: "settings-password",
    side: "top",
    text: {
      en: { title: "Password", description: "Change the password for your own account at any time." },
      hi: { title: "पासवर्ड", description: "अपने अकाउंट का पासवर्ड कभी भी बदलें।" },
      gu: { title: "પાસવર્ડ", description: "તમારા એકાઉન્ટનો પાસવર્ડ ગમે ત્યારે બદલો." },
    },
  },
];
