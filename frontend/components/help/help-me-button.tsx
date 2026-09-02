"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LANGUAGES, MODULES, startModuleTour } from "@/lib/tours";
import type { ModuleKey, TourLanguage } from "@/lib/tours/types";

const LANG_STORAGE_KEY = "munshi_tour_lang";

const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  cashbook: BookOpen,
  sales: ShoppingCart,
  purchases: Truck,
  employees: Users,
  settings: Settings,
};

const TEXT: Record<
  TourLanguage,
  { button: string; langTitle: string; langDesc: string; moduleTitle: string; moduleDesc: string; back: string }
> = {
  en: {
    button: "Help me",
    langTitle: "Choose a language",
    langDesc: "Pick the language for your guided tour.",
    moduleTitle: "Which module?",
    moduleDesc: "We'll open it and walk you through it, step by step.",
    back: "Back",
  },
  hi: {
    button: "मदद करें",
    langTitle: "भाषा चुनें",
    langDesc: "अपने गाइडेड टूर के लिए भाषा चुनें।",
    moduleTitle: "कौन सा मॉड्यूल?",
    moduleDesc: "हम उसे खोलकर आपको चरण-दर-चरण दिखाएँगे।",
    back: "पीछे",
  },
  gu: {
    button: "મદદ કરો",
    langTitle: "ભાષા પસંદ કરો",
    langDesc: "તમારા ગાઇડેડ ટૂર માટે ભાષા પસંદ કરો.",
    moduleTitle: "કયું મોડ્યુલ?",
    moduleDesc: "અમે તેને ખોલીને તમને પગલું-દર-પગલું બતાવીશું.",
    back: "પાછળ",
  },
};

/** Floating "Help me" launcher: pick a language, pick a module, get a driver.js guided tour of it. */
export function HelpMeButton() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"language" | "module">("language");
  const [language, setLanguage] = React.useState<TourLanguage>("en");

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY) as TourLanguage | null;
      if (saved === "en" || saved === "hi" || saved === "gu") setLanguage(saved);
    } catch {
      // localStorage unavailable — fall back to English
    }
  }, []);

  const t = TEXT[language];

  function openDialog() {
    setStep("language");
    setOpen(true);
  }

  function chooseLanguage(lang: TourLanguage) {
    setLanguage(lang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    setStep("module");
  }

  function chooseModule(moduleKey: ModuleKey) {
    setOpen(false);
    startModuleTour(moduleKey, language, (path) => router.push(path), pathname ?? "");
  }

  return (
    <>
      <Button
        onClick={openDialog}
        className="fixed bottom-20 left-4 z-40 rounded-full shadow-lg md:bottom-4"
        size="sm"
      >
        <HelpCircle className="h-4 w-4" />
        {t.button}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {step === "language" ? (
            <>
              <DialogHeader>
                <DialogTitle>{t.langTitle}</DialogTitle>
                <DialogDescription>{t.langDesc}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGES.map((l) => (
                  <Button
                    key={l.key}
                    variant={language === l.key ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => chooseLanguage(l.key)}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t.moduleTitle}</DialogTitle>
                <DialogDescription>{t.moduleDesc}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((m) => {
                  const Icon = MODULE_ICONS[m.key];
                  return (
                    <Button
                      key={m.key}
                      variant="outline"
                      className={cn("h-auto flex-col gap-1.5 py-4")}
                      onClick={() => chooseModule(m.key)}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label[language]}
                    </Button>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setStep("language")}>
                {t.back}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
