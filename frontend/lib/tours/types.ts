export type TourLanguage = "en" | "hi" | "gu";

export type ModuleKey = "dashboard" | "cashbook" | "sales" | "purchases" | "employees" | "settings";

export type TourStepSide = "top" | "right" | "bottom" | "left";
export type TourStepAlign = "start" | "center" | "end";

export interface TourStepText {
  title: string;
  description: string;
}

/** One highlighted spot in a tour: the element it targets, plus copy in every supported language. */
export interface TourStepDef {
  /** Matches the `data-tour` attribute of the element to highlight. */
  target: string;
  side?: TourStepSide;
  align?: TourStepAlign;
  text: Record<TourLanguage, TourStepText>;
}
