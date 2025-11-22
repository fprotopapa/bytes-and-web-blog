// GDPR Consent Management Utility

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  youtube: boolean;
  timestamp: number;
}

const CONSENT_KEY = 'gdpr-consent';

export const defaultConsent: ConsentState = {
  essential: true, // Always required
  analytics: false,
  youtube: false,
  timestamp: 0,
};

/**
 * Get current consent state from localStorage
 */
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ConsentState;
  } catch {
    return null;
  }
}

/**
 * Save consent state to localStorage
 */
export function setConsent(consent: Partial<ConsentState>): void {
  if (typeof window === 'undefined') return;

  const current = getConsent() || defaultConsent;
  const updated: ConsentState = {
    ...current,
    ...consent,
    essential: true, // Always true
    timestamp: Date.now(),
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(updated));

  // Dispatch custom event for components to react
  window.dispatchEvent(new CustomEvent('consent-updated', {
    detail: updated
  }));
}

/**
 * Check if a specific consent category is granted
 */
export function hasConsent(category: keyof Omit<ConsentState, 'timestamp'>): boolean {
  if (typeof window === 'undefined') return false;

  const consent = getConsent();
  if (!consent) return false;

  return consent[category] === true;
}

/**
 * Check if any consent has been given (banner was interacted with)
 */
export function hasInteracted(): boolean {
  if (typeof window === 'undefined') return false;
  return getConsent() !== null;
}

/**
 * Accept all consent categories
 */
export function acceptAll(): void {
  setConsent({
    essential: true,
    analytics: true,
    youtube: true,
  });
}

/**
 * Reject all non-essential consent categories
 */
export function rejectAll(): void {
  setConsent({
    essential: true,
    analytics: false,
    youtube: false,
  });
}

/**
 * Clear all consent data
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent('consent-cleared'));
}
