import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

import { cashbookSteps } from "@/lib/tours/content/cashbook";
import { dashboardSteps } from "@/lib/tours/content/dashboard";
import { employeesSteps } from "@/lib/tours/content/employees";
import { purchasesSteps } from "@/lib/tours/content/purchases";
import { salesSteps } from "@/lib/tours/content/sales";
import { settingsSteps } from "@/lib/tours/content/settings";
import type { ModuleKey, TourLanguage, TourStepDef } from "@/lib/tours/types";

const MODULE_STEPS: Record<ModuleKey, TourStepDef[]> = {
  dashboard: dashboardSteps,
  cashbook: cashbookSteps,
  sales: salesSteps,
  purchases: purchasesSteps,
  employees: employeesSteps,
  settings: settingsSteps,
};

export const MODULES: { key: ModuleKey; path: string; label: Record<TourLanguage, string> }[] = [
  { key: "dashboard", path: "/dashboard", label: { en: "Dashboard", hi: "डैशबोर्ड", gu: "ડેશબોર્ડ" } },
  { key: "cashbook", path: "/cashbook", label: { en: "CashBook", hi: "कैशबुक", gu: "કેશબુક" } },
  { key: "sales", path: "/sales", label: { en: "Sales", hi: "सेल्स", gu: "સેલ્સ" } },
  { key: "purchases", path: "/purchases", label: { en: "Purchases", hi: "परचेज़", gu: "પરચેઝ" } },
  { key: "employees", path: "/employees", label: { en: "Employees", hi: "एम्प्लॉयीज़", gu: "એમ્પ્લોયીઝ" } },
  { key: "settings", path: "/settings", label: { en: "Settings", hi: "सेटिंग्स", gu: "સેટિંગ્સ" } },
];

export const LANGUAGES: { key: TourLanguage; label: string }[] = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी" },
  { key: "gu", label: "ગુજરાતી" },
];

const UI_TEXT: Record<TourLanguage, { next: string; previous: string; done: string; progress: string }> = {
  en: { next: "Next", previous: "Previous", done: "Done", progress: "{{current}} of {{total}}" },
  hi: { next: "आगे", previous: "पीछे", done: "पूर्ण", progress: "{{total}} में से {{current}}" },
  gu: { next: "આગળ", previous: "પાછળ", done: "પૂર્ણ", progress: "{{total}} માંથી {{current}}" },
};

/**
 * `data-tour` targets can appear twice (desktop sidebar + mobile bottom nav) —
 * pick whichever copy is actually visible on screen right now.
 */
function resolveTourElement(target: string): Element | undefined {
  const matches = Array.from(document.querySelectorAll(`[data-tour="${target}"]`));
  return matches.find((el) => (el as HTMLElement).offsetParent !== null) ?? matches[0];
}

function toDriveSteps(defs: TourStepDef[], lang: TourLanguage): DriveStep[] {
  return defs.map((def) => ({
    element: () => resolveTourElement(def.target) as Element,
    popover: {
      title: def.text[lang].title,
      description: def.text[lang].description,
      side: def.side,
      align: def.align,
    },
  }));
}

/**
 * Starts the guided tour for a module in the given language. Navigates there
 * first if needed — `waitForElement` lets driver.js wait for the new page's
 * DOM to mount instead of us hand-rolling a polling loop.
 */
export function startModuleTour(
  moduleKey: ModuleKey,
  lang: TourLanguage,
  navigate: (path: string) => void,
  currentPath: string
) {
  const target = MODULES.find((m) => m.key === moduleKey);
  if (!target) return;

  if (!currentPath.startsWith(target.path)) {
    navigate(target.path);
  }

  const ui = UI_TEXT[lang];
  const driverObj = driver({
    showProgress: true,
    overlayOpacity: 0.65,
    stagePadding: 6,
    stageRadius: 8,
    allowClose: true,
    waitForElement: 4000,
    skipMissingElement: true,
    nextBtnText: ui.next,
    prevBtnText: ui.previous,
    doneBtnText: ui.done,
    progressText: ui.progress,
    steps: toDriveSteps(MODULE_STEPS[moduleKey], lang),
  });
  driverObj.drive();
  return driverObj;
}
