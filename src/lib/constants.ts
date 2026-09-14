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

/** Sociálne siete a weby: FE nikdy nezobrazí surovú URL, lenštka „Facebook"/„Instagram". */
export const ACCESSIBILITY_OPTIONS = [
  { value: "Áno", label: "Áno" },
  { value: "Čiastočne", label: "Čiastočne" },
  { value: "Nie", label: "Nie" },
] as const;

export const ERASMUS_OPTIONS = [
  { value: "Žiadne", label: "Žiadne" },
  { value: "Španielsko", label: "Španielsko" },
  { value: "Francúzsko", label: "Francúzsko" },
  { value: "Veľká Británia", label: "Veľká Británia" },
  { value: "Kanada", label: "Kanada" },
  { value: "Nemecko", label: "Nemecko" },
  { value: "Rakúsko", label: "Rakúsko" },
  { value: "Taliansko", label: "Taliansko" },
  { value: "Portugalsko", label: "Portugalsko" },
  { value: "Írsko", label: "Írsko" },
  { value: "Fínsko", label: "Fínsko" },
  { value: "Holandsko", label: "Holandsko" },
  { value: "Belgicko", label: "Belgicko" },
  { label: "Dánsko", value: "Dánsko" },
  { label: "Nórsko", value: "Nórsko" },
  { label: "Maďarsko", value: "Maďarsko" },
  { label: "Poľsko", value: "Poľsko" },
  { label: "Česko", value: "Česko" },
] as const;

export const INTERNAT_OPTIONS = [
  { value: "Vlastný internát", label: "Vlastný internát" },
  { value: "Externý internát", label: "Externý internát" },
] as const;

export const BADGE_KIND_OPTIONS = [
  { value: "ok", label: "zelená (pozitívne)" },
  { value: "mat", label: "tyrkysová (info)" },
  { value: "vl", label: "oranžová (upozornenie)" },
  { value: "term", label: "ružová (termín)" },
] as const;
