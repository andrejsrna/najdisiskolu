-- Adresy sú prevzaté z oficiálneho registra TTSK (trnava-vuc.sk/typ_institucie/ss/), 2026-09-17.
-- Iba presne spárované školy podľa názvu a mesta.
UPDATE "School" SET "address" = CASE "slug"
  WHEN 'gymnazium-frantiska-vitazoslava-sasinka' THEN 'Námestie slobody 3, Skalica'
  WHEN 'gymnazium-imre-madacha-s-vjm-madach-imre-gimnazium' THEN 'Slnečná 2, Šamorín'
  WHEN 'gymnazium-ivana-kupca' THEN 'Komenského 13, Hlohovec'
  WHEN 'gymnazium-janka-matusku' THEN 'Štvrť SNP 1004/34, Galanta'
  WHEN 'gymnazium-jana-baltazara-magina' THEN 'Beňovského 358/100, Vrbové'
  WHEN 'gymnazium-jana-holleho' THEN 'Na hlinách 7279/30, Trnava'
  WHEN 'gymnazium-ladislava-dubravu' THEN 'Smetanov háj 285/8, Dunajská Streda'
  WHEN 'gymnazium-ladislava-novomeskeho' THEN 'Dlhá 1037/12, Senica'
  WHEN 'gymnazium-m-r-stefanika' THEN 'Slnečná 1117/2, Šamorín'
  WHEN 'gymnazium-pierra-de-coubertina' THEN 'Námestie SNP 9, Piešťany'
  WHEN 'gymnazium-vojtecha-mihalika' THEN 'Kostolná 119/8, Sereď'
  WHEN 'gymnazium-zoltana-kodalya-s-vjm-kodaly-zoltan-gimnazium' THEN 'Štvrť SNP 1004/34, Galanta'
  WHEN 'gymnazium-a-stredna-sportova-skola-jozefa-herdu' THEN 'J. Bottu 31, Trnava'
  WHEN 'gymnazium-armina-vamberyho-s-vjm-vambery-armin-gimnazium' THEN 'Námestie sv. Štefana 1190/4, Dunajská Streda'
  WHEN 'hotelova-akademia-ludovita-wintera' THEN 'Stromová 34, Piešťany'
  WHEN 'obchodna-akademia-sered' THEN 'Mládežnícka 158/5, Sereď'
  WHEN 'obchodna-akademia' THEN 'Dlhá 256/10, Senica'
  WHEN 'obchodna-akademia-trnava' THEN 'Kukučínova 2, Trnava'
  WHEN 'obchodna-akademia-kereskedelmi-akademia' THEN 'Bratislavská 38, Veľký Meder'
  WHEN 'spojena-skola-sos-informatiky-a-sluzieb-s-vjm-a-sos-stavebna-s-vjm' THEN 'Gyulu Szabóa 21, Dunajská Streda'
  WHEN 'spojena-skola-sos-technicka-jozefa-cabelku-a-sos-dopravy-a-sluzieb' THEN 'Námestie sv. Martina 5, Holíč'
  WHEN 'stredna-odborna-skola-automobilova' THEN 'Coburgova 7859/39, Trnava'
  WHEN 'stredna-odborna-skola-chemicka-a-skola-umeleckeho-priemyslu' THEN 'Nerudova 13, Hlohovec'
  WHEN 'stredna-odborna-skola-elektrotechnicka' THEN 'Učňovská 700/6, Gbely'
  WHEN 'stredna-odborna-skola-elektrotechnicka-trnava' THEN 'Sibírska 1, Trnava'
  WHEN 'stredna-odborna-skola-obchodu-a-sluzieb' THEN 'Z. Kodálya 765, Galanta'
  WHEN 'stredna-odborna-skola-obchodu-a-sluzieb-piestany' THEN 'Mojmírova 99/28, Piešťany'
  WHEN 'stredna-odborna-skola-obchodu-a-sluzieb-trnava' THEN 'Lomonosovova 2797/6, Trnava'
  WHEN 'stredna-odborna-skola-podnikania-v-remeslach-a-sluzbach' THEN 'V. Paulínyho Tótha 31/5, Senica'
  WHEN 'stredna-odborna-skola-polnohospodarstva-a-sluzieb-na-vidieku' THEN 'Zavarská 9, Trnava'
  WHEN 'stredna-odborna-skola-regionalneho-rozvoja-a-stredna-odborna-skola-zahradnicka' THEN 'Rakovice 25, Rakovice'
  WHEN 'stredna-odborna-skola-rozvoja-vidieka-s-vjm-a-stredna-sportova-skola-s-vjm' THEN 'Námestie sv. Štefana 1533/3, Dunajská Streda'
  WHEN 'stredna-odborna-skola-strojnicka' THEN 'Ul. pplk. Pľjušťa 29, Skalica'
  WHEN 'stredna-odborna-skola-technicka' THEN 'F. Lipku 2422/5, Hlohovec'
  WHEN 'stredna-odborna-skola-technicka-piestany' THEN 'Nová 5245/9, Piešťany'
  WHEN 'stredna-odborna-skola-technicka-muszaki-szakkozepiskola' THEN 'Kračanská cesta 1240/36, Dunajská Streda'
  WHEN 'stredna-odborna-skola-technicka-muszaki-szakkozepiskola-galanta' THEN 'Esterházyovcov 712/10, Galanta'
  WHEN 'stredna-priemyselna-skola-dopravna' THEN 'Študentská 23, Trnava'
  WHEN 'stredna-priemyselna-skola-elektrotechnicka' THEN 'Brezová 2, Piešťany'
  WHEN 'stredna-priemyselna-skola-stavebna-dusana-samuela-jurkovica' THEN 'Lomonosovova 7, Trnava'
  WHEN 'stredna-priemyselna-skola-technicka' THEN 'Komenského 1, Trnava'
  WHEN 'stredna-zdravotnicka-skola' THEN 'Lichardova 1, Skalica'
  WHEN 'stredna-zdravotnicka-skola-trnava' THEN 'Daxnerova 6, Trnava'
  WHEN 'stredna-zdravotnicka-skola-egeszsegugyi-kozepiskola' THEN 'Športová 349/34, Dunajská Streda'
  ELSE "address"
END;

-- Rakovice: historický import zdvojil celý text partnerstiev.
UPDATE "School"
SET "partners" = regexp_replace(
  "partners",
  E'\\+\\s*Spolupracujeme[\\s\\S]*$',
  ''
)
WHERE "slug" = 'stredna-odborna-skola-regionalneho-rozvoja-a-stredna-odborna-skola-zahradnicka'
  AND "partners" ~ E'\\+\\s*Spolupracujeme';
