/** Shared contact field placeholders and validators */



export const EMAIL_PLACEHOLDER = "you@example.com";

export const PHONE_PLACEHOLDER = "+63 917 123 4567";

export const GCASH_REF_PLACEHOLDER = "5092003318223";



const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const GCASH_REF_REGEX = /^\d{13}$/;



export function normalizePhoneInput(value: string): string {

  return value.replace(/[^\d+\s\-()]/g, "");

}



export function normalizeGcashRefInput(value: string): string {

  return value.replace(/\D/g, "").slice(0, 13);

}



export function validateEmail(value: string, required = true): string | null {

  const trimmed = value.trim();

  if (!trimmed) return required ? "Email is required." : null;

  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email (e.g. name@domain.com).";

  return null;

}



export function validatePhone(value: string, required = false): string | null {

  const trimmed = value.trim();

  if (!trimmed) return required ? "Phone number is required." : null;

  const normalized = trimmed.replace(/[\s\-()]/g, "");

  if (!PHONE_REGEX.test(normalized)) {

    return "Use format +63 917 123 4567 (country code, then number).";

  }

  return null;

}



export function validateGcashRef(value: string): string | null {

  if (!value) return "GCash reference code is required.";

  if (!GCASH_REF_REGEX.test(value)) return "Enter the 13-digit GCash reference code.";

  return null;

}


