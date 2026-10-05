/**
 * Shared TypeScript definitions for browser-evaluated scripts on the Indian Visa Portal.
 * Eliminates all 'any' assertions in page.evaluate functions.
 */

export interface JcropInstance {
  setSelect: (coords: [number, number, number, number]) => void;
}

export interface JQueryElementLite {
  trigger: (eventName: string) => JQueryElementLite;
  val: (val?: string | number) => string | number | undefined;
  prop: (name: string, val?: boolean) => boolean | undefined;
  attr: (name: string, val?: string) => string | undefined;
  removeAttr: (name: string) => JQueryElementLite;
  change?: () => JQueryElementLite;
  click?: () => void;
  width?: () => number;
  height?: () => number;
  length?: number;
  data?: (key: string) => JcropInstance | Record<string, unknown> | undefined;
  [index: number]: HTMLElement | undefined;
}

export type JQueryFn = (selector: string | HTMLElement | EventTarget | null) => JQueryElementLite;

export interface IndianVisaPortalWindow extends Window {
  $?: JQueryFn;
  jQuery?: JQueryFn;
  verify?: () => void;
  refreshCaptcha?: () => void;
  validate_registration_form?: (step?: number) => void;
  copyAddress?: () => void;
  sameAddress?: () => void;
}

export interface InPageEvalResult {
  __error?: string;
  __stack?: string;
  [key: string]: unknown;
}
