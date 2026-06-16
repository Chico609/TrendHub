/**
 * @file src/lib/utils.ts
 * @description Utility functions for TrendHub
 * @author TrendHub Engineering
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
