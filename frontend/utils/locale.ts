export type LocaleMap = {
  en?: string;
  he?: string;
  ar?: string;
  th?: string;
};

export function resolveLocaleText(
  localeMap: LocaleMap | null | undefined,
  locale: string,
  fallback: string,
) {
  const value = localeMap?.[locale as keyof LocaleMap];
  if (value && value.trim()) return value;
  const english = localeMap?.en;
  if (english && english.trim()) return english;
  return fallback;
}
