/**
 * Type-safe local storage utility
 */

export const storage = {
  /**
   * Get an item from local storage
   */
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') {
      return defaultValue ?? null;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue ?? null);
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue ?? null;
    }
  },

  /**
   * Set an item in local storage
   */
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  /**
   * Remove an item from local storage
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  },

  /**
   * Clear all items from local storage
   */
  clear: (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Check if a key exists in local storage
   */
  has: (key: string): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(key) !== null;
  },
};

/**
 * Local storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  SITES_SELECTED_SITE: 'sites_selected_site',
  SITES_SELECTED_COMPOUND: 'sites_selected_compound',
  SITES_SELECTED_CELLS: 'sites_selected_cells',
  SITES_DATE_RANGE: 'sites_date_range',
} as const;
