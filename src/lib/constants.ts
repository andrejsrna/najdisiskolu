export const DISTRICTS = [
  "Dunajská Streda",
  "Galanta",
  "Hlohovec",
  "Piešťany",
  "Senica",
  "Skalica",
  "Trnava",
] as const;

export const COMPLETION_OPTIONS = [
  { value: "MATURITA", label: "maturita" },
  { value: "VYUCNY_LIST", label: "výučný list" },
  { value: "MATURITA_A_VYUCNY_LIST", label: "maturita + výučný list" },
  { value: "ZAVERECNA_SKUSKA", label: "záverečná skúška" },
] as const;

export const COMPLETION_LABEL: Record<string, string> = Object.fromEntries(
  COMPLETION_OPTIONS.map((o) => [o.value, o.label]),
);

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrátor",
  SCHOLSTVO: "Odbor školstva",
  SKOLA: "Škola",
};

export const LANGUAGE_OPTIONS = [
  { value: "sk", label: "slovenský" },
  { value: "hu", label: "maďarský" },
  { value: "en", label: "anglický (bilingválne)" },
  { value: "ru", label: "ruský (bilingválne)" },
] as const;

export const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((o) => [o.value, o.label]),
);
