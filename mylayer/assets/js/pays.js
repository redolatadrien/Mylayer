/* ==========================================================================
   MyLayer — la liste des pays
   --------------------------------------------------------------------------
   Codes ISO 3166-1 alpha-2, noms en français, classés par nom.
   Les codes sont stockés avec les noms : c’est ce qui permettra plus tard
   d’allumer une carte du monde sans re-deviner les intitulés.
   Aux États souverains s’ajoutent les territoires où l’on va vraiment en
   voyage — quelqu’un qui a vu la Polynésie ne coche pas « France ».
   Format compact « CODE:Nom », découpé au chargement : une liste de 200
   objets écrite à la main pèserait cinq fois plus.
   ========================================================================== */

window.MYLAYER_PAYS = ('AF:Afghanistan|ZA:Afrique du Sud|AL:Albanie|DZ:Algérie|'
+ 'DE:Allemagne|AD:Andorre|AO:Angola|AG:Antigua-et-Barbuda|SA:Arabie saoudite|'
+ 'AR:Argentine|AM:Arménie|AW:Aruba|AU:Australie|AT:Autriche|AZ:Azerbaïdjan|'
+ 'BS:Bahamas|BH:Bahreïn|BD:Bangladesh|BB:Barbade|BE:Belgique|BZ:Belize|'
+ 'BJ:Bénin|BM:Bermudes|BT:Bhoutan|BY:Biélorussie|MM:Birmanie (Myanmar)|'
+ 'BO:Bolivie|BA:Bosnie-Herzégovine|BW:Botswana|BR:Brésil|BN:Brunei|'
+ 'BG:Bulgarie|BF:Burkina Faso|BI:Burundi|KH:Cambodge|CM:Cameroun|CA:Canada|'
+ 'CV:Cap-Vert|CL:Chili|CN:Chine|CY:Chypre|CO:Colombie|KM:Comores|'
+ 'CG:Congo (Brazzaville)|CD:Congo (RDC)|KP:Corée du Nord|KR:Corée du Sud|'
+ 'CR:Costa Rica|CI:Côte d’Ivoire|HR:Croatie|CU:Cuba|CW:Curaçao|DK:Danemark|'
+ 'DJ:Djibouti|DM:Dominique|EG:Égypte|AE:Émirats arabes unis|EC:Équateur|'
+ 'ER:Érythrée|ES:Espagne|EE:Estonie|SZ:Eswatini|US:États-Unis|ET:Éthiopie|'
+ 'FJ:Fidji|FI:Finlande|FR:France|GA:Gabon|GM:Gambie|GE:Géorgie|GH:Ghana|'
+ 'GI:Gibraltar|GR:Grèce|GD:Grenade|GL:Groenland|GP:Guadeloupe|GT:Guatemala|'
+ 'GF:Guyane française|GN:Guinée|GW:Guinée-Bissau|GQ:Guinée équatoriale|'
+ 'GY:Guyana|HT:Haïti|HN:Honduras|HK:Hong Kong|HU:Hongrie|KY:Îles Caïmans|'
+ 'FO:Îles Féroé|MH:Îles Marshall|SB:Îles Salomon|IN:Inde|ID:Indonésie|'
+ 'IQ:Irak|IR:Iran|IE:Irlande|IS:Islande|IL:Israël|IT:Italie|JM:Jamaïque|'
+ 'JP:Japon|JO:Jordanie|KZ:Kazakhstan|KE:Kenya|KG:Kirghizistan|KI:Kiribati|'
+ 'XK:Kosovo|KW:Koweït|LA:Laos|LS:Lesotho|LV:Lettonie|LB:Liban|LR:Liberia|'
+ 'LY:Libye|LI:Liechtenstein|LT:Lituanie|LU:Luxembourg|MK:Macédoine du Nord|'
+ 'MG:Madagascar|MY:Malaisie|MW:Malawi|MV:Maldives|ML:Mali|MT:Malte|MA:Maroc|'
+ 'MQ:Martinique|MU:Maurice|MR:Mauritanie|MX:Mexique|FM:Micronésie|'
+ 'MD:Moldavie|MC:Monaco|MN:Mongolie|ME:Monténégro|MZ:Mozambique|NA:Namibie|'
+ 'NR:Nauru|NP:Népal|NI:Nicaragua|NE:Niger|NG:Nigeria|NO:Norvège|'
+ 'NC:Nouvelle-Calédonie|NZ:Nouvelle-Zélande|OM:Oman|UG:Ouganda|'
+ 'UZ:Ouzbékistan|PK:Pakistan|PW:Palaos|PS:Palestine|PA:Panama|'
+ 'PG:Papouasie-Nouvelle-Guinée|PY:Paraguay|NL:Pays-Bas|PE:Pérou|'
+ 'PH:Philippines|PL:Pologne|PF:Polynésie française|PR:Porto Rico|'
+ 'PT:Portugal|QA:Qatar|RE:La Réunion|CF:République centrafricaine|'
+ 'DO:République dominicaine|CZ:République tchèque|RO:Roumanie|'
+ 'GB:Royaume-Uni|RU:Russie|RW:Rwanda|KN:Saint-Christophe-et-Niévès|'
+ 'SM:Saint-Marin|VC:Saint-Vincent-et-les-Grenadines|LC:Sainte-Lucie|'
+ 'SV:Salvador|WS:Samoa|ST:Sao Tomé-et-Principe|SN:Sénégal|RS:Serbie|'
+ 'SC:Seychelles|SL:Sierra Leone|SG:Singapour|SK:Slovaquie|SI:Slovénie|'
+ 'SO:Somalie|SD:Soudan|SS:Soudan du Sud|LK:Sri Lanka|SE:Suède|CH:Suisse|'
+ 'SR:Suriname|SY:Syrie|TJ:Tadjikistan|TW:Taïwan|TZ:Tanzanie|TD:Tchad|'
+ 'TH:Thaïlande|TL:Timor oriental|TG:Togo|TO:Tonga|TT:Trinité-et-Tobago|'
+ 'TN:Tunisie|TM:Turkménistan|TR:Turquie|TV:Tuvalu|UA:Ukraine|UY:Uruguay|'
+ 'VU:Vanuatu|VA:Vatican|VE:Venezuela|VN:Viêt Nam|YE:Yémen|ZM:Zambie|'
+ 'ZW:Zimbabwe').split('|').map(function (p) {
  var c = p.indexOf(':');
  return { code: p.slice(0, c), nom: p.slice(c + 1) };
});
