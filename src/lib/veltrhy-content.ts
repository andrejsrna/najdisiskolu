/** Obsah veľtrhovej stránky (statické bloky) — canonical zdroj = demo HTML.
 *  Seed ho pri prvom nasadení nahrá do Setting ("veltrhy.sections");
 *  stránka ho číta z DB a pri výpadku padá späť na tieto východzie hodnoty. */

export type VeltrhySections = {
  lead: string;
  whatCells: string[];
  tipsIntro: string;
  tipsCells: string[];
  dodIntro: string;
  helpHeading: string;
  helpText: string;
};

export const VELTRHY_SECTIONS_KEY = "veltrhy.sections";

export const VELTRHY_SECTIONS_DEFAULT: VeltrhySections = {
  lead:
    "Raz do roka sa všetkých 44 župných stredných škôl stretne na jednom mieste. Za jedno popoludnie sa porozprávaš s toľkými školami, koľko by si inak obchádzal celú jeseň - a hlavne so žiakmi, ktorí na nich naozaj študujú.",
  whatCells: [
    "Stánok každej zo 44 župných stredných škôl - na jednom mieste, bez cestovania",
    "Ukážky prác a praktické dielne - uvidíš, čo sa v odbore naozaj robí",
    "Študenti škôl, ktorí odpovedia na to, na čo sa učiteľa spýtať nechceš",
    "Zástupcovia firiem, ktoré berú žiakov do duálneho vzdelávania",
    "Talentcentrum - pomôže ti zistiť, v čom máš predpoklady",
    "Kariérové poradenstvo pre teba aj pre rodičov",
  ],
  tipsIntro:
    "Väčšina deviatakov prejde halu za dvadsať minút a odnesie si tašku letákov. Škoda - dá sa to aj inak.",
  tipsCells: [
    "Pozri si vopred, ktoré školy ťa zaujímajú, a vyber si tri až päť stánkov, kde sa naozaj zastavíš",
    "Priprav si otázky - čo presne budem robiť na praxi, kam idú absolventi, koľko vás vlani prijali",
    "Choď s rodičom, ale nechaj sa pýtať sám - ide o tvoje štyri roky",
    "Pýtaj sa študentov, nie len učiteľov pri stánku",
    "Zapíš si termín dňa otvorených dverí škôl, ktoré ťa zaujali",
    "Nerozhoduj sa na mieste - doma si to v pokoji porovnaj",
  ],
  dodIntro:
    "Veľtrh ti dá prehľad, deň otvorených dverí ti dá pocit z konkrétnej školy. Choď aspoň na dve - porovnanie ti povie viac než ktorýkoľvek leták.",
  helpHeading: "Nestíhaš ani jeden veľtrh?",
  helpText:
    "Nevadí. Prejdi si ponuku škôl online a napíš priamo tej, ktorá ťa zaujme.",
};