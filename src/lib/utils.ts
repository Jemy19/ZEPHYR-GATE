import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to interpolate strings
// Replaces placeholders like {{variable_name}} in a string with the corresponding value from the params object.
// Used extensively in Gatekeeper and App.tsx to merge AI-extracted parameters into test case templates.
export const interpolate = (text: string, params: Record<string, string>) => {
  let result = text || '';
  Object.keys(params).forEach(key => {
    // Replace {{key}} globally throughout the string
    const regex = new RegExp(`{{${key}}}`, 'g');
    // If a parameter is missing or empty, it leaves the placeholder intact (or replaces it with itself)
    result = result.replace(regex, params[key] || `{{${key}}}`);
  });
  return result;
};
