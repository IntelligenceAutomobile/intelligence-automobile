// Catalogue de référence marques / modèles pour les filtres du site.
//
// Deux groupes dans le menu déroulant :
//   1. MAIN_MAKES — les cinq marques sur lesquelles l'activité est centrée
//   2. OTHER_MAKES — le reste, classé par volume de ventes en Europe
//
// Les libellés de modèles sont en français (« Série 3 », « Classe C ») car ils
// servent à filtrer le champ `model` de la base, qui est saisi en français.

export const MAIN_MAKES = [
  "Audi",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Porsche",
] as const;

// Classées par volume d'immatriculations en Europe, puis par présence sur le
// marché de l'occasion pour les marques confidentielles et disparues.
export const OTHER_MAKES = [
  // Grande diffusion
  "Toyota",
  "Renault",
  "Peugeot",
  "Škoda",
  "Dacia",
  "Kia",
  "Hyundai",
  "Ford",
  "Citroën",
  "Opel",
  "Fiat",
  "Nissan",
  "Seat",
  "Volvo",
  "Suzuki",
  "Mazda",
  "Cupra",
  "Tesla",
  "Mini",
  "Jeep",
  "Land Rover",
  "Honda",
  "Mitsubishi",
  "MG",
  "Lexus",
  "DS Automobiles",
  "Alfa Romeo",
  "Smart",
  "Subaru",
  "BYD",
  "Polestar",
  "Jaguar",
  "Abarth",
  "Lancia",
  // Diffusion plus confidentielle
  "Vauxhall",
  "Genesis",
  "Alpine",
  "Maserati",
  "SsangYong",
  "KGM",
  "Isuzu",
  "Infiniti",
  "Acura",
  "Daihatsu",
  "Datsun",
  "Lada",
  // Nouveaux entrants chinois
  "Leapmotor",
  "Xpeng",
  "Nio",
  "Zeekr",
  "Lynk & Co",
  "Omoda",
  "Jaecoo",
  "Chery",
  "Great Wall",
  "Haval",
  "Ora",
  "Maxus",
  "Aiways",
  "Hongqi",
  "Dongfeng",
  "JAC",
  "BAIC",
  "Voyah",
  "Seres",
  "DFSK",
  "Wuling",
  "Skywell",
  // Américaines
  "Chevrolet",
  "Dodge",
  "Chrysler",
  "Cadillac",
  "GMC",
  "Ram",
  "Lincoln",
  "Buick",
  "Hummer",
  "Rivian",
  "Lucid",
  "Fisker",
  // Sportives et luxe
  "Ferrari",
  "Lamborghini",
  "Bentley",
  "Aston Martin",
  "Rolls-Royce",
  "McLaren",
  "Lotus",
  "Bugatti",
  "Koenigsegg",
  "Pagani",
  "Rimac",
  "Alpina",
  "Morgan",
  "Caterham",
  "Donkervoort",
  "Spyker",
  "TVR",
  "Noble",
  "Ginetta",
  "De Tomaso",
  "Wiesmann",
  // Historiques et disparues
  "Saab",
  "Rover",
  "Daewoo",
  "Talbot",
  "Simca",
  "Austin",
  "Triumph",
  "Morris",
  "Autobianchi",
  "Innocenti",
  "Matra",
  "Borgward",
  "NSU",
  "Trabant",
] as const;

const AUDI_MODELS = [
  // Berlines et compactes
  "A1", "A2", "A3", "A4", "A4 Allroad", "A5", "A6", "A6 Allroad", "A7", "A8",
  // S
  "S1", "S3", "S4", "S5", "S6", "S7", "S8",
  // RS
  "RS2", "RS3", "RS4", "RS5", "RS6", "RS7",
  // SUV
  "Q2", "SQ2", "Q3", "Q3 Sportback", "RS Q3",
  "Q4 e-tron", "Q5", "Q5 Sportback", "SQ5", "Q6 e-tron",
  "Q7", "SQ7", "Q8", "SQ8", "RS Q8", "Q8 e-tron",
  // Coupés et sportives
  "TT", "TTS", "TT RS", "R8", "Quattro",
  // Électriques
  "e-tron", "e-tron GT", "RS e-tron GT", "A6 e-tron",
  // Anciennes générations
  "50", "60", "80", "90", "100", "200", "V8",
  "Coupé", "Cabriolet", "Allroad",
];

const BMW_MODELS = [
  // Séries
  "Série 1", "Série 2", "Série 2 Active Tourer", "Série 2 Gran Coupé", "Série 2 Gran Tourer",
  "Série 3", "Série 3 GT", "Série 4", "Série 4 Gran Coupé",
  "Série 5", "Série 5 GT", "Série 6", "Série 6 Gran Turismo",
  "Série 7", "Série 8", "Série 8 Gran Coupé",
  // M
  "M2", "M3", "M4", "M5", "M6", "M8", "M1",
  // X
  "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM",
  // Z
  "Z1", "Z3", "Z3 M", "Z4", "Z4 M", "Z8",
  // Électriques
  "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3",
  // Anciennes générations
  "1602", "2002", "2002 Turbo", "3.0 CS", "3.0 CSL", "501", "507", "700", "Isetta",
];

const MERCEDES_MODELS = [
  // Classes
  "Classe A", "Classe B", "Classe C", "Classe E", "Classe S",
  "Classe G", "Classe R", "Classe V", "Classe X",
  // Coupés et berlines coupé
  "CLA", "CLA Shooting Brake", "CLC", "CLK", "CLS",
  // Roadsters et sportives
  "SL", "SLC", "SLK", "SLR McLaren", "SLS AMG",
  "AMG GT", "AMG GT 4 portes", "AMG ONE", "CLK GTR",
  // SUV
  "GLA", "GLB", "GLC", "GLC Coupé", "GLE", "GLE Coupé", "GLS", "GLK", "GL", "ML",
  // Électriques
  "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV",
  // Utilitaires et vans
  "Citan", "Vito", "Viano", "Vaneo", "Sprinter", "Marco Polo",
  // Maybach
  "Maybach Classe S", "Maybach GLS",
  // Anciennes générations
  "190", "190 E", "200", "220", "230", "240", "250", "260", "280",
  "300", "300 SL", "320", "350", "380", "420", "450", "500", "560", "600",
  "Pagode", "W123", "W124", "W126",
];

const VOLKSWAGEN_MODELS = [
  // Compactes et berlines
  "Golf", "Golf Plus", "Golf Sportsvan", "Golf Variant", "Golf Cabriolet",
  "Polo", "Passat", "Passat CC", "CC", "Arteon", "Jetta", "Bora", "Vento", "Santana",
  // Coupés et cabriolets
  "Corrado", "Scirocco", "Eos", "Karmann Ghia",
  // Coccinelle et dérivés
  "Coccinelle", "New Beetle", "Beetle", "Type 3", "Type 181",
  // Citadines
  "up!", "e-up!", "Lupo", "Fox",
  // SUV et monospaces
  "Touareg", "Touran", "Sharan", "Tiguan", "Tiguan Allspace", "Tayron",
  "T-Roc", "T-Cross", "Taigo", "Atlas", "Teramont", "Nivus", "Phaeton",
  // Électriques
  "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz",
  // Utilitaires et vans
  "Amarok", "Caddy", "Transporter", "Multivan", "Caravelle", "California",
  "Combi", "Crafter", "LT",
];

const PORSCHE_MODELS = [
  // 911 et déclinaisons
  "911", "911 Carrera", "911 Targa", "911 Turbo",
  "911 GT3", "911 GT3 RS", "911 GT2", "911 GT2 RS",
  "911 Speedster", "911 Dakar", "911 S/T", "911 GT1",
  // Sportives à moteur central
  "Boxster", "718 Boxster", "718 Spyder",
  "Cayman", "718 Cayman", "Cayman GT4",
  // SUV et berlines
  "Cayenne", "Cayenne Coupé", "Macan", "Macan Electric",
  "Panamera", "Taycan", "Taycan Cross Turismo",
  // Séries limitées
  "Carrera GT", "918 Spyder", "959",
  // Anciennes générations
  "356", "550 Spyder", "912", "914", "924", "928", "944", "968",
];

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Audi: AUDI_MODELS,
  BMW: BMW_MODELS,
  "Mercedes-Benz": MERCEDES_MODELS,
  Volkswagen: VOLKSWAGEN_MODELS,
  Porsche: PORSCHE_MODELS,
};

/**
 * Modèles connus d'une marque. La comparaison ignore casse et accents, pour
 * retrouver le catalogue même quand la base orthographie la marque autrement.
 */
export function getModelsForMake(make: string): string[] {
  const key = normalizeLabel(make);
  const match = Object.keys(MODELS_BY_MAKE).find((m) => normalizeLabel(m) === key);
  return match ? MODELS_BY_MAKE[match] : [];
}

/** Retire accents et casse pour comparer deux libellés saisis différemment. */
export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
