export interface CountryData {
  code: string;
  name: string;
  flag: string;
  phonePrefix: string;
  currency: string;
  communes: Record<string, string[]>;
}

export const COUNTRIES: Record<string, CountryData> = {
  CI: {
    code: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    phonePrefix: '+225',
    currency: 'FCFA',
    communes: {
      "Cocody": [
        "Angré (8ème Tranche, 7ème Tranche, Djibi, Nouveau CHU)",
        "Riviera (Riviera 3, Riviera 4, Palmeraie, Faya, M'Pouto)",
        "Deux Plateaux (Vallons, Mobil, Aghien, Las Palmas)",
        "Blockhauss",
        "Cité des Arts",
        "Danga",
        "Sogefiha Cocody",
        "Riviera Bonoumin"
      ],
      "Yopougon": [
        "Niangon (Niangon Nord, Niangon Sud)",
        "Toits Rouges",
        "Selmer",
        "Maroc",
        "Sogefiha Yopougon",
        "Siporex",
        "Bel Air",
        "Gesco",
        "Wassakara",
        "Cité Verte",
        "Millionnaire"
      ],
      "Marcory": [
        "Zone 4 (Biétry, Rue du Canal)",
        "Marcory Résidentiel",
        "Marcory Sans Fil",
        "Zone 3",
        "Marcory Aliodan",
        "Marcory Hibiscus",
        "Marcory SICOGI"
      ],
      "Abobo": [
        "Abobo Baoulé",
        "Abobo Té",
        "Dokui (Plateau Dokui)",
        "Avocatier",
        "PK 18",
        "Sogefiha Abobo",
        "Anonkoua Kouté",
        "Samaké"
      ],
      "Koumassi": [
        "Koumassi Prodom",
        "Zone Industrielle",
        "Koumassi Remblais",
        "Koumassi Divo",
        "Koumassi 05",
        "Sogefiha Koumassi"
      ],
      "Treachville": [
        "Zone 1",
        "Arras",
        "Belvue",
        "Avenue 16",
        "Cité Policière"
      ],
      "Adjamé": [
        "220 Logements",
        "Williamsville",
        "Mirador",
        "Paillet"
      ],
      "Port-Bouët": [
        "Vridi",
        "Gonzagueville",
        "Jean Folly",
        "Derrière-Water"
      ],
      "Plateau": [
        "Centre-ville",
        "Indénié"
      ],
      "Attécoubé": [
        "Agban",
        "Mossikro",
        "Boribana"
      ],
      "Bouaké": [
        "N'Gattakro",
        "Ahougnansou",
        "Kennedy",
        "Nimbo",
        "Broukro"
      ],
      "Yamoussoukro": [
        "220 Logements",
        "Assabou",
        "Morofé",
        "N'Gokro",
        "Dioulabou"
      ]
    }
  },
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    phonePrefix: '+221',
    currency: 'FCFA',
    communes: {
      "Dakar Plateau": [
        "Centre-ville",
        "Avenue Ponty",
        "Rebeuss",
        "Sandaga"
      ],
      "Médina": [
        "Rue 6",
        "Rue 22",
        "Tilène",
        "Soumbédioune"
      ],
      "Fann-Point E-Amitié": [
        "Fann Résidence",
        "Point E",
        "Amitié 1",
        "Amitié 2",
        "Amitié 3"
      ],
      "Yoff": [
        "Yoff Layène",
        "Yoff Tonghor",
        "Cité Biagui",
        "Nord Foire"
      ],
      "Almadies": [
        "Les Almadies",
        "Ngor",
        "Virage",
        "Mamelles"
      ],
      "Ouakam": [
        "Cité Avion",
        "Mamelles Ouakam",
        "Tout-petit"
      ],
      "Mermoz-Sacré-Cœur": [
        "Mermoz",
        "Sacré-Cœur 1",
        "Sacré-Cœur 2",
        "Sacré-Cœur 3",
        "VDN"
      ],
      "Parcelles Assainies": [
        "Unité 1 à 26",
        "Grand Médine"
      ],
      "Grand Yoff": [
        "Scat Urbam",
        "Cité Millionnaire",
        "Khar Yalla"
      ],
      "Hann Bel-Air": [
        "Maristes",
        "Bel-Air",
        "Hann Plage"
      ],
      "Guédiawaye": [
        "Golf Sud",
        "Sam Notaire",
        "Wakhinane Nimzatt"
      ],
      "Pikine": [
        "Pikine Est",
        "Pikine Ouest",
        "Djiddah Thiaroye Kao"
      ],
      "Rufisque": [
        "Rufisque Est",
        "Rufisque Ouest",
        "Rufisque Nord"
      ],
      "Thiès": [
        "Thiès Est",
        "Thiès Ouest",
        "Thiès Nord"
      ],
      "Saint-Louis": [
        "Ndar (Île)",
        "Sor",
        "Guet N'dar",
        "Gokhou M'bath"
      ]
    }
  },
  CM: {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    phonePrefix: '+237',
    currency: 'FCFA',
    communes: {
      "Douala I": [
        "Bonanjo",
        "Akwa",
        "Bonapriso",
        "Bali",
        "Deido"
      ],
      "Douala II": [
        "New Bell",
        "Nkololoun",
        "Babylone"
      ],
      "Douala III": [
        "Ndokoti",
        "Bassa",
        "Logbaba",
        "Nyalla"
      ],
      "Douala IV": [
        "Bonabéri",
        "Bojongo",
        "Sodiko"
      ],
      "Douala V": [
        "Kotto",
        "Logbessou",
        "Ndogbong",
        "Makepe",
        "Beedi"
      ],
      "Yaoundé I": [
        "Bastos",
        "Djoungolo",
        "Etoudi",
        "Emana",
        "Nlongkak"
      ],
      "Yaoundé II": [
        "Tsinga",
        "Madagascar",
        "Mokolo",
        "Briqueterie"
      ],
      "Yaoundé III": [
        "Efoulan",
        "Mvolye",
        "Ahala",
        "Obobogo"
      ],
      "Yaoundé IV": [
        "Mimboman",
        "Kondengui",
        "Ekounou",
        "Odza"
      ],
      "Yaoundé V": [
        "Essos",
        "Mvog-Ada",
        "Ngousso",
        "Omnisports"
      ],
      "Yaoundé VI": [
        "Biyem-Assi",
        "Melen",
        "Mendong"
      ],
      "Yaoundé VII": [
        "Nkolbisson",
        "Oyom-Abang"
      ]
    }
  },
  ML: {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    phonePrefix: '+223',
    currency: 'FCFA',
    communes: {
      "Commune I (Bamako)": [
        "Boulkassoumbougou",
        "Djélibougou",
        "Doumanzana",
        "Fadjiguila"
      ],
      "Commune II (Bamako)": [
        "Hippodrome",
        "Niaréla",
        "Bagadadji",
        "Medina Coura",
        "Missira"
      ],
      "Commune III (Bamako)": [
        "Badalabougou",
        "Quartier du Fleuve",
        "Bamako Coura",
        "N'Tomikorobougou"
      ],
      "Commune IV (Bamako)": [
        "Hamdallaye",
        "Lafiabougou",
        "Sébénikoro",
        "Djicoroni Para"
      ],
      "Commune V (Bamako)": [
        "Baco-Djikoroni",
        "Torokorobougou",
        "Daoudabougou",
        "Sabalibougou"
      ],
      "Commune VI (Bamako)": [
        "Sogoniko",
        "Quartier Mali",
        "Banankabougou",
        "Magnambougou",
        "Niamakoro"
      ]
    }
  },
  BF: {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    phonePrefix: '+226',
    currency: 'FCFA',
    communes: {
      "Arrondissement 1 (Ouaga)": [
        "Koulouba",
        "Dapoya",
        "Paspanga",
        "Bilbalogho"
      ],
      "Arrondissement 2 (Ouaga)": [
        "Larlé",
        "Ouidi",
        "Somgandé"
      ],
      "Arrondissement 3 (Ouaga)": [
        "Tampouy",
        "Kilwin",
        "Tanghin"
      ],
      "Arrondissement 4 (Ouaga)": [
        "Somgandé Nord",
        "Kossodo"
      ],
      "Arrondissement 5 (Ouaga)": [
        "Patte d'Oie",
        "Ouaga 2000",
        "Dassasgho"
      ],
      "Bobo-Dioulasso": [
        "Diarradougou",
        "Koko",
        "Bolomakoté",
        "Accart-ville",
        "Bindougousso"
      ]
    }
  },
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    phonePrefix: '+229',
    currency: 'FCFA',
    communes: {
      "Cotonou 1er Arr.": [
        "Dandji",
        "Donaten",
        "Tchanhounkpamè",
        "Akpakpa"
      ],
      "Cotonou 2ème Arr.": [
        "Gégéan",
        "Lom Nava",
        "Senade"
      ],
      "Cotonou 3ème Arr.": [
        "Adogléta",
        "Segbeya",
        "Midombo"
      ],
      "Cotonou 4ème Arr.": [
        "Sodjeatimè",
        "Fifadji",
        "Les Cocotiers"
      ],
      "Cotonou 5ème Arr.": [
        "Guinkomey",
        "Saint-Michel",
        "Zongo"
      ],
      "Cotonou 6ème Arr.": [
        "Haie Vive",
        "Cadjehoun",
        "Fidjrossè",
        "Hindé"
      ],
      "Porto-Novo": [
        "Adjina",
        "Avakpa",
        "Oganla",
        "Tokpota",
        "Foun-Foun"
      ]
    }
  },
  TG: {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    phonePrefix: '+228',
    currency: 'FCFA',
    communes: {
      "Golfe 1 (Lomé)": [
        "Bè",
        "Akodésséwa",
        "Ablogamé"
      ],
      "Golfe 2 (Lomé)": [
        "Hédzranawoé",
        "Tokoin",
        "Wuiti"
      ],
      "Golfe 3 (Lomé)": [
        "Tokoin Forever",
        "Hanoukopé",
        "Gbonvié"
      ],
      "Golfe 4 (Lomé)": [
        "Nyékonakpoé",
        "Dékon",
        "Kodjoviakopé",
        "Amoutivé"
      ],
      "Golfe 5 (Lomé)": [
        "Totsi",
        "Aflao Gakli",
        "Djidjolé"
      ],
      "Agoè-Nyivé": [
        "Agoè Centre",
        "Agoè Kossigan",
        "Agoè Assiyéyé"
      ]
    }
  },
  GA: {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    phonePrefix: '+241',
    currency: 'FCFA',
    communes: {
      "1er Arrondissement (Libreville)": [
        "La Sablière",
        "Bas de Gué-Gué",
        "Haut de Gué-Gué"
      ],
      "2ème Arrondissement (Libreville)": [
        "Cocotiers",
        "Nombakélé",
        "Louis"
      ],
      "3ème Arrondissement (Libreville)": [
        "Mont-Bouët",
        "Kinguélé",
        "Belle Peinture"
      ],
      "4ème Arrondissement (Libreville)": [
        "Glass",
        "Baraka",
        "London"
      ],
      "5ème Arrondissement (Libreville)": [
        "Soduco",
        "Ozangué",
        "Lalala"
      ],
      "6ème Arrondissement (Libreville)": [
        "Nzeng-Ayong",
        "Dragages"
      ],
      "Akanda": [
        "Angondjé",
        "Avorbam"
      ],
      "Owendo": [
        "Alénakiri",
        "Port-Gentil (gare)"
      ]
    }
  },
  GN: {
    code: 'GN',
    name: 'Guinée',
    flag: '🇬🇳',
    phonePrefix: '+224',
    currency: 'FG',
    communes: {
      "Kaloum": [
        "Almamya",
        "Boulbinet",
        "Coronthie",
        "Sandervalia"
      ],
      "Dixinn": [
        "Landréah",
        "Camayenne",
        "Kassa",
        "Minière"
      ],
      "Matam": [
        "Madina",
        "Bonfi",
        "Touguiwondy"
      ],
      "Ratoma": [
        "Kipé",
        "Lambanyi",
        "Nongo",
        "Taouyah"
      ],
      "Matoto": [
        "Cosa",
        "Sangoyah",
        "Yimbaya",
        "Gbéssia"
      ]
    }
  },
  CD: {
    code: 'CD',
    name: 'RDC (Congo-Kinshasa)',
    flag: '🇨🇩',
    phonePrefix: '+243',
    currency: 'USD/FC',
    communes: {
      "La Gombe": [
        "Centre-ville",
        "Fleuve",
        "Jolie Parc"
      ],
      "Limete": [
        "Résidentiel",
        "Industriel",
        "Kingabwa"
      ],
      "Ngaliema": [
        "Binza Pigeon",
        "Binza Delvaux",
        "Macampagne",
        "UPN"
      ],
      "Kintambo": [
        "Jamaïque",
        "Wenze",
        "Itaga"
      ],
      "Bandalungwa": [
        "Bisengo",
        "Lubudi",
        "Makelele"
      ],
      "Lemba": [
        "Super",
        "Righini",
        "Salongo"
      ],
      "Lingwala": [
        "Singa Mopepe",
        "Gbado"
      ],
      "Barumbu": [
        "Ndolo",
        "Funa"
      ]
    }
  }
};
