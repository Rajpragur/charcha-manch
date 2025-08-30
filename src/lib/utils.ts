import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format nagrik name in the format "nagrik_XXXX (नागरिक_XXXX)"
export function formatNagrikName(nagrikNumber: number): string {
  return `Nagrik_${nagrikNumber} (नागरिक_${nagrikNumber})`;
}

// Get nagrik display based on language preference
export function getNagrikDisplay(nagrikNumber: number, isEnglish: boolean = false): string {
  if (isEnglish) {
    return `Nagrik_${nagrikNumber}`;
  } else {
    return `नागरिक_${nagrikNumber}`;
  }
}

// Get just the nagrik number part for display (deprecated, use getNagrikDisplay instead)
export function getNagrikDisplayOld(nagrikNumber: number): string {
  return `नागरिक_${nagrikNumber}`;
}
