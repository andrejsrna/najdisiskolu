// Otázky a odpovede — statický obsah z HTML prototypu.
export type QAItem = [string, string]; // [otázka, odpoveď (HTML)]
export type QAGroup = [string, QAItem[]];

export const QA: QAGroup[] = 
[
  [
    "Prihláška - kedy a ako",
    [
      [
        "Dokedy musím podať prihlášku?",
        "Do <b>20. februára</b>. Podávať sa dá od 8. februára, takže máš na to necelé dva týždne. Termín je daný zákonom a neposúva sa - po ňom už škola prihlášku neprijme."
      ],
      [
        "Na koľko škôl sa môžem prihlásiť?",
        "Na <b>štyri odbory</b> - najviac dva talentové a najviac dva netalentové. Môžu byť aj na tej istej škole. Poradie, v akom ich uvedieš, vyjadruje tvoj záujem a po 20. februári sa už nedá zmeniť, takže si ho premysli."
      ],
      [
        "Ako sa prihláška podáva?",
        "Elektronicky cez portál ministerstva školstva <b>eprihlasky.iedu.sk</b>, alebo v papierovej podobe cez základnú školu. Elektronická cesta je rýchlejšia a hneď vidíš, či prihláška dorazila."
      ],
      [
        "Kto prihlášku podpisuje?",
        "Obaja zákonní zástupcovia. Ak to nie je možné, stačí podpis jedného spolu s vyhlásením, že sa na podaní dohodli."
      ],
      [
        "Musím na prihlášku uvádzať známky?",
        "Nie, prospech doplní základná škola. Ty vypĺňaš odbory, ich poradie a kontaktné údaje."
      ]
    ]
  ],
  [
    "Prijímacie skúšky",
    [
      [
        "Kedy sú prijímacie skúšky?",
        "Netalentové odbory majú dva termíny - prvý začiatkom mája, druhý približne o týždeň neskôr. Talentové skúšky sú výrazne skôr, koncom marca. Presné dátumy na daný školský rok zverejňuje ministerstvo školstva; naposledy to boli <b>4. a 11. mája</b> pre netalentové a <b>23. a 30. marca</b> pre talentové odbory."
      ],
      [
        "Čo sa na prijímačkách píše?",
        "Test zo slovenského jazyka a literatúry a test z matematiky v rozsahu učiva základnej školy. Niektoré školy pridávajú test z cudzieho jazyka alebo overenie špeciálnych schopností - vždy to nájdeš v <b>kritériách prijatia</b> konkrétnej školy."
      ],
      [
        "Čo je talentová skúška a koho sa týka?",
        "Overuje nadanie, ktoré sa testom zmerať nedá - športové, umelecké, hudobné alebo jazykové. Týka sa športových škôl, umeleckých odborov a bilingválneho štúdia. Má <b>skorší termín</b>, takže si ju treba všimnúť včas."
      ],
      [
        "Môžu ma prijať bez prijímacích skúšok?",
        "Áno. Pri väčšine trojročných učebných odborov sa prijímacie skúšky nekonajú a rozhoduje prospech zo základnej školy. Podmienky sú v kritériách prijatia každej školy."
      ],
      [
        "Ako sa mám pripraviť?",
        "Najlepšie tým, že si prejdeš testy z minulých rokov a zopakuješ učivo. Mnohé školy organizujú prijímačky nanečisto - spýtaj sa na dni otvorených dverí."
      ]
    ]
  ],
  [
    "Výsledky, zápis a druhé kolo",
    [
      [
        "Kedy sa dozviem, či ma prijali?",
        "Do <b>1. júna</b>. Škola zverejní zoznam prijatých pod kódmi a zároveň pošle rozhodnutie zákonným zástupcom."
      ],
      [
        "Prijali ma na viac škôl. Čo teraz?",
        "Nastúpiť môžeš len na jednu. Vyberieš si ju a pošleš jej <b>potvrdenie o nastúpení</b>. Tým zároveň uvoľníš miesta na ostatných školách pre spolužiakov, ktorí čakajú - preto s tým netreba otáľať."
      ],
      [
        "Neprijali ma. Čo môžem robiť?",
        "Máš dve možnosti. <b>Odvolanie</b> podávaš do piatich dní od doručenia rozhodnutia - často sa uvoľnia miesta po žiakoch, ktorí nastúpili inde. A začiatkom júna sa otvára <b>druhé kolo</b>."
      ],
      [
        "Ako funguje druhé kolo?",
        "Prihlášku podáš od <b>3. do 8. júna</b>, tentoraz len na jeden odbor, a to na školu, ktorej ostali voľné miesta. Skúšky bývajú v polovici júna a rozhodnutie dostaneš do konca júna. Do školy nastupuješ normálne 1. septembra."
      ],
      [
        "Kde zistím, ktoré školy majú voľné miesta?",
        "Prehľad voľných miest po prvom kole zverejňuje kraj a nájdeš ho aj na tomto portáli."
      ]
    ]
  ],
  [
    "Ako si vybrať školu",
    [
      [
        "Neviem, čo chcem študovať. Ako mám začať?",
        "Začni tým, čo ťa baví, nie tým, čo znie perspektívne - štyri roky sú dlhé a na nebaviacom odbore prejdú pomaly. Pozri si, aké odbory v kraji vôbec sú, a pri tých, ktoré ťa zaujmú, si prečítaj, čím sa ich absolventi živia. Pomôže aj rozhovor s výchovným poradcom na základnej škole."
      ],
      [
        "Gymnázium alebo odborná škola?",
        "Gymnázium ti dá <b>čas</b> - rozhodnutie o povolaní odkladá o štyri roky a pripravuje ťa na vysokú školu. Odborná škola ti dá <b>remeslo</b> a možnosť zarábať hneď po škole, pričom na vysokú ísť môžeš tiež. Ak už vieš, čo chceš robiť, odborná škola je rýchlejšia cesta. Ak nevieš, gymnázium ti nechá otvorené dvere."
      ],
      [
        "Čo je duálne vzdelávanie?",
        "Prax nerobíš v školskej dielni, ale priamo <b>vo firme, ktorá ti za ňu platí</b>. Firma ťa často po škole aj zamestná. Nie je to pri každom odbore - školy s duálom si vieš vyfiltrovať."
      ],
      [
        "Oplatí sa dnes ešte výučný list?",
        "Remeselníkov je na trhu práce dlhodobo málo a šikovný absolvent s výučným listom si zarobí viac než nejeden vysokoškolák. A ak by si sa neskôr rozhodol pre maturitu, môžeš pokračovať v nadstavbovom štúdiu."
      ],
      [
        "Ako spoznám, či je škola dobrá?",
        "Pozri sa na tri veci: koľko prihlášok mala vlani na jedno miesto, čo o nej hovoria jej absolventi a či má odbor, ktorý ťa naozaj zaujíma. A choď sa tam pozrieť osobne - atmosféru školy z webu nevyčítaš."
      ],
      [
        "Môžem si školu prísť pozrieť?",
        "Áno. Každá župná stredná škola organizuje <b>deň otvorených dverí</b>, väčšinou v novembri a decembri. Termíny nájdeš pri každej škole aj v prehľade na stránke Veľtrhy škôl."
      ]
    ]
  ],
  [
    "Praktické veci",
    [
      [
        "Ako je to s internátom?",
        "Ubytovanie ponúka časť škôl, väčšinou priamo v areáli alebo v jeho blízkosti. Ak dochádzanie neprichádza do úvahy, vyfiltruj si školy s internátom."
      ],
      [
        "Koľko štúdium stojí?",
        "Štúdium na župnej strednej škole je <b>bezplatné</b>. Platí sa strava, prípadne internát, a pri niektorých odboroch pracovné oblečenie či pomôcky. Žiaci v duálnom vzdelávaní naopak dostávajú od firmy odmenu."
      ],
      [
        "Ako sa budem do školy dostávať?",
        "Žiaci stredných škôl majú v prímestskej autobusovej doprave zľavnené alebo bezplatné cestovné. Konkrétne podmienky nájdeš u dopravcu."
      ],
      [
        "Mám špeciálne výchovno-vzdelávacie potreby. Prijmú ma?",
        "Áno. Uveď to v prihláške - škola potom upraví podmienky prijímacej skúšky aj samotné štúdium. Viaceré školy majú vlastného školského psychológa alebo špeciálneho pedagóga."
      ],
      [
        "Chcem študovať v maďarčine.",
        "V kraji je desať škôl s vyučovacím jazykom maďarským, najmä v okresoch Dunajská Streda a Galanta. Vyfiltruj si ich podľa vyučovacieho jazyka."
      ],
      [
        "Dá sa škola alebo odbor počas štúdia zmeniť?",
        "Dá, prestup je možný - ale nie je automatický, závisí od voľnej kapacity a rozdielov v učive. Rozhodnutie na začiatku má preto váhu, aj keď nie je nezvratné."
      ]
    ]
  ]
]
;
