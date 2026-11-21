import {
  categoryMeta,
  type AnalysisResult,
  type CategoryId,
  type DuplicateMatch,
  type Priority,
  type Recommendation,
  type SignalWeight,
} from "@/lib/types";

export type AnalyzeInput = {
  title: string;
  description: string;
  language?: string;
  neighbourhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  imageSampleKey?: string | null;
  imageFeatures?: {
    brightness: number;
    saturation: number;
    greenness: number;
    grayness: number;
  } | null;
  duplicateCount?: number;
};

export type ExistingReport = {
  id: number;
  reference: string;
  title: string;
  description: string;
  category: CategoryId;
  status: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  createdAt: string;
};

type WeightedTerm = { term: string; w: number };

const LEXICON: Record<CategoryId, WeightedTerm[]> = {
  garbage: [
    { term: "garbage", w: 3 },
    { term: "trash", w: 3 },
    { term: "bin", w: 2 },
    { term: "bins", w: 2 },
    { term: "dump", w: 3 },
    { term: "dumping", w: 3 },
    { term: "waste", w: 2 },
    { term: "litter", w: 2.5 },
    { term: "overflowing", w: 2.5 },
    { term: "rubbish", w: 3 },
    { term: "refuse", w: 2 },
    { term: "plastic", w: 1.5 },
    { term: "smell", w: 1.5 },
    { term: "flies", w: 1.5 },
    { term: "segregation", w: 2 },
    { term: "koodai", w: 2.5 },
    { term: "kachra", w: 3 },
    { term: "कचरा", w: 3 },
    { term: "basura", w: 3 },
    { term: "ordures", w: 3 },
    { term: "takataka", w: 3 },
    { term: "قمامة", w: 3 },
  ],
  water: [
    { term: "water", w: 2.5 },
    { term: "leak", w: 3 },
    { term: "leaking", w: 3 },
    { term: "leakage", w: 3 },
    { term: "pipe", w: 2.5 },
    { term: "pipeline", w: 2.5 },
    { term: "burst", w: 2.5 },
    { term: "drain", w: 2 },
    { term: "drainage", w: 2 },
    { term: "flood", w: 2.5 },
    { term: "flooding", w: 2.5 },
    { term: "tap", w: 2 },
    { term: "hydrant", w: 2.5 },
    { term: "sewage", w: 2.5 },
    { term: "puddle", w: 1.5 },
    { term: "pani", w: 2 },
    { term: "पानी", w: 2.5 },
    { term: "agua", w: 2.5 },
    { term: "eau", w: 2.5 },
    { term: "maji", w: 2.5 },
    { term: "ماء", w: 2.5 },
  ],
  roads: [
    { term: "pothole", w: 3.5 },
    { term: "potholes", w: 3.5 },
    { term: "road", w: 2 },
    { term: "roadworks", w: 2 },
    { term: "asphalt", w: 2.5 },
    { term: "pavement", w: 2 },
    { term: "footpath", w: 2.5 },
    { term: "crack", w: 2 },
    { term: "cracked", w: 2 },
    { term: "tar", w: 2 },
    { term: "speed breaker", w: 2 },
    { term: "sinking", w: 2 },
    { term: "uneven", w: 2 },
    { term: "bump", w: 1.5 },
    { term: "sadak", w: 2.5 },
    { term: "सड़क", w: 2.5 },
    { term: "carretera", w: 2.5 },
    { term: "route", w: 2 },
    { term: "barabara", w: 2.5 },
    { term: "طريق", w: 2.5 },
  ],
  lighting: [
    { term: "streetlight", w: 3.5 },
    { term: "street light", w: 3.5 },
    { term: "streetlights", w: 3.5 },
    { term: "lamp", w: 3 },
    { term: "lamp post", w: 3.5 },
    { term: "light", w: 2 },
    { term: "lights", w: 2 },
    { term: "dark", w: 2 },
    { term: "darkness", w: 2.5 },
    { term: "unlit", w: 3 },
    { term: "flickering", w: 2.5 },
    { term: "bulb", w: 2.5 },
    { term: "electric", w: 2 },
    { term: "wiring", w: 2 },
    { term: "night", w: 1.5 },
    { term: "safe", w: 1 },
    { term: "बत्ती", w: 2.5 },
    { term: "रोशनी", w: 2.5 },
    { term: "luz", w: 2.5 },
    { term: "lampe", w: 2.5 },
    { term: "taa", w: 2 },
    { term: "ضوء", w: 2.5 },
  ],
  food: [
    { term: "food", w: 3 },
    { term: "meal", w: 2.5 },
    { term: "meals", w: 2.5 },
    { term: "wasted", w: 2.5 },
    { term: "wastage", w: 3 },
    { term: "leftover", w: 3 },
    { term: "leftovers", w: 3 },
    { term: "surplus", w: 3 },
    { term: "kitchen", w: 2 },
    { term: "canteen", w: 2.5 },
    { term: "restaurant", w: 2 },
    { term: "hunger", w: 2 },
    { term: "donate", w: 2 },
    { term: "thrown away", w: 2.5 },
    { term: "khana", w: 2 },
    { term: "खाना", w: 2.5 },
    { term: "comida", w: 2.5 },
    { term: "nourriture", w: 2.5 },
    { term: "chakula", w: 2.5 },
    { term: "طعام", w: 2.5 },
  ],
  infrastructure: [
    { term: "bench", w: 3 },
    { term: "bus stop", w: 3 },
    { term: "shelter", w: 2.5 },
    { term: "signboard", w: 2.5 },
    { term: "sign", w: 2 },
    { term: "gate", w: 2 },
    { term: "fence", w: 2 },
    { term: "playground", w: 2.5 },
    { term: "swing", w: 2.5 },
    { term: "toilet", w: 2.5 },
    { term: "public property", w: 2 },
    { term: "broken", w: 1.5 },
    { term: "damaged", w: 1.5 },
    { term: "collapsed", w: 2 },
    { term: "wall", w: 1.5 },
    { term: "paark", w: 1.5 },
    { term: "बेंच", w: 2.5 },
    { term: "banco", w: 2.5 },
    { term: "banc", w: 2.5 },
    { term: "benchi", w: 2.5 },
    { term: "مقعد", w: 2.5 },
  ],
};

const SEVERITY_TERMS: { term: string; w: number; label: string }[] = [
  { term: "accident", w: 12, label: "accident risk" },
  { term: "injured", w: 12, label: "injury reported" },
  { term: "injury", w: 12, label: "injury reported" },
  { term: "children", w: 9, label: "children nearby" },
  { term: "school", w: 9, label: "near a school" },
  { term: "hospital", w: 9, label: "near a hospital" },
  { term: "elderly", w: 8, label: "elderly residents" },
  { term: "wheelchair", w: 8, label: "accessibility risk" },
  { term: "emergency", w: 11, label: "emergency language" },
  { term: "danger", w: 10, label: "explicit danger" },
  { term: "dangerous", w: 10, label: "explicit danger" },
  { term: "unsafe", w: 10, label: "explicit safety risk" },
  { term: "fire", w: 11, label: "fire risk" },
  { term: "electric", w: 7, label: "electrical hazard" },
  { term: "shock", w: 7, label: "electrical hazard" },
  { term: "disease", w: 9, label: "disease vector" },
  { term: "mosquito", w: 7, label: "mosquito breeding" },
  { term: "dengue", w: 10, label: "public health alert" },
  { term: "drinking water", w: 9, label: "drinking water affected" },
  { term: "flood", w: 8, label: "flooding" },
  { term: "night", w: 5, label: "night-time exposure" },
  { term: "dark", w: 5, label: "unlit at night" },
  { term: "week", w: 4, label: "recurring for a week" },
  { term: "weeks", w: 6, label: "unresolved for weeks" },
  { term: "month", w: 7, label: "unresolved for a month" },
  { term: "since morning", w: 6, label: "ongoing today" },
  { term: "again", w: 3, label: "repeat occurrence" },
  { term: "huge", w: 3, label: "large scale" },
  { term: "overflowing", w: 5, label: "overflowing" },
  { term: "main road", w: 5, label: "main road" },
  { term: "market", w: 4, label: "crowded area" },
  { term: "बच्चे", w: 8, label: "children nearby" },
  { term: "खतरा", w: 9, label: "explicit danger" },
  { term: "niños", w: 8, label: "children nearby" },
  { term: "peligro", w: 9, label: "explicit danger" },
  { term: "enfants", w: 8, label: "children nearby" },
  { term: "danger", w: 9, label: "explicit danger" },
  { term: "watoto", w: 8, label: "children nearby" },
  { term: "hatari", w: 9, label: "explicit danger" },
  { term: "أطفال", w: 8, label: "children nearby" },
  { term: "خطر", w: 9, label: "explicit danger" },
];

const SAMPLE_VISION: Record<string, Partial<Record<CategoryId, number>>> = {
  garbage: { garbage: 0.94, infrastructure: 0.03, food: 0.02, roads: 0.01 },
  water: { water: 0.92, infrastructure: 0.05, roads: 0.02, garbage: 0.01 },
  roads: { roads: 0.91, infrastructure: 0.06, water: 0.02, garbage: 0.01 },
  lighting: { lighting: 0.88, infrastructure: 0.08, roads: 0.03, garbage: 0.01 },
  food: { food: 0.9, garbage: 0.07, water: 0.02, infrastructure: 0.01 },
  infrastructure: { infrastructure: 0.86, roads: 0.07, water: 0.04, garbage: 0.03 },
};

const STOPWORDS = new Set(
  "the a an and or is are was were be been near this that there here it its in on at of to for with from we our my i you they them he she has have had very much lot lots please some any just still today yesterday also but not no yes do does did get got seen see noticed notice around by as if then than so about into over under after before again".split(
    " ",
  ),
);

const BASE_RISK: Record<CategoryId, number> = {
  garbage: 40,
  water: 52,
  roads: 46,
  lighting: 50,
  food: 34,
  infrastructure: 30,
};

const RECOMMENDATIONS: Record<CategoryId, Recommendation[]> = {
  garbage: [
    {
      title: "Secure the waste area",
      detail:
        "Ask the nearest shop or resident group to keep the bin lid closed and stop extra dumping until pickup.",
      owner: "Community",
    },
    {
      title: "Log a collection request",
      detail:
        "Raise a missed-pickup ticket with the Waste Management Cell including the photo and this report ID.",
      owner: "Waste Management Cell",
    },
    {
      title: "Watch for the health signal",
      detail:
        "If waste has been sitting 48+ hours or has started to smell, escalate as a public health issue.",
      owner: "Health Inspector",
    },
  ],
  water: [
    {
      title: "Stop the flow if it is safe",
      detail:
        "If it is a public tap or exposed valve, close it gently. Never open a buried pipeline yourself.",
      owner: "Community",
    },
    {
      title: "Call the water control room",
      detail:
        "Report the burst line to the Water Supply Board with the exact landmark; leaks near roads can erode the surface quickly.",
      owner: "Water Supply Board",
    },
    {
      title: "Mark the hazard",
      detail:
        "Place a visible, safe marker near the leak so cyclists and pedestrians avoid the slippery patch.",
      owner: "Community",
    },
  ],
  roads: [
    {
      title: "Flag the exact spot",
      detail:
        "Add a second photo from the opposite direction so the repair crew can find the pothole on the carriageway.",
      owner: "Community",
    },
    {
      title: "Submit a road-safety request",
      detail:
        "Public Works can usually patch with hot mix if the request is attached to this report and the location pin.",
      owner: "Public Works Department",
    },
    {
      title: "Warn riders now",
      detail:
        "Share the report with the local rider group or building WhatsApp list until a repair is scheduled.",
      owner: "Community",
    },
  ],
  lighting: [
    {
      title: "Report the pole number",
      detail:
        "Most repairs need the asset number printed on the pole. Add it as an update to speed up the fix.",
      owner: "Community",
    },
    {
      title: "Request an interim light",
      detail:
        "Ask for a temporary solar lamp near the unlit stretch while the permanent circuit is repaired.",
      owner: "Electrical & Lighting Wing",
    },
    {
      title: "Avoid the dark stretch",
      detail:
        "Alert neighbours walking after sunset and arrange a group walk until the light is restored.",
      owner: "Community",
    },
  ],
  food: [
    {
      title: "Offer the surplus today",
      detail:
        "Connect the kitchen with the nearest food-redistribution volunteer before the safe serving window closes.",
      owner: "Community Food Network",
    },
    {
      title: "Share a portion estimate",
      detail:
        "Add how many meals are available so volunteers bring the correct number of containers.",
      owner: "Community",
    },
    {
      title: "Plan tomorrow's batch",
      detail:
        "If this repeats daily, ask the kitchen to track head-count and cook to demand for a week.",
      owner: "Kitchen Manager",
    },
  ],
  infrastructure: [
    {
      title: "Cordon off the damage",
      detail:
        "If the asset is unsafe, keep a visible distance and inform the caretaker of the public space.",
      owner: "Community",
    },
    {
      title: "File an asset repair request",
      detail:
        "The Civic Assets Team needs the asset type and photo; reference this report in the request.",
      owner: "Civic Assets Team",
    },
    {
      title: "Ask for a shared fix",
      detail:
        "Bundle neighbouring asset damage into one request so the team can repair the whole cluster in one visit.",
      owner: "Community",
    },
  ],
};

const CATEGORY_HINTS: Record<string, string> = {
  garbage: "trash, bins, dump, litter",
  water: "water, leak, pipe, drain, flood",
  roads: "pothole, road, pavement, crack",
  lighting: "streetlight, lamp, dark, unlit",
  food: "food, meals, surplus, leftovers",
  infrastructure: "bench, bus stop, sign, playground",
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalise(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function detectLanguage(text: string, fallback = "en"): string {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/\b(agua|basura|carretera|fugas|niños|peligro)\b/i.test(text)) return "es";
  if (/\b(eau|ordures|route|fuite|enfants|dangers)\b/i.test(text)) return "fr";
  if (/\b(maji|takataka|barabara|watoto|hatari)\b/i.test(text)) return "sw";
  return fallback;
}

function textScores(text: string): {
  scores: Record<CategoryId, number>;
  hits: Record<CategoryId, string[]>;
} {
  const padded = ` ${normalise(text)} `;
  const scoreRecord = {
    garbage: 0,
    water: 0,
    roads: 0,
    lighting: 0,
    food: 0,
    infrastructure: 0,
  } satisfies Record<CategoryId, number>;
  const hitRecord: Record<CategoryId, string[]> = {
    garbage: [],
    water: [],
    roads: [],
    lighting: [],
    food: [],
    infrastructure: [],
  };

  (Object.keys(LEXICON) as CategoryId[]).forEach((category) => {
    LEXICON[category].forEach(({ term, w }) => {
      const needle = normalise(term);
      if (!needle) return;
      if (padded.includes(` ${needle} `) || padded.includes(` ${needle}`)) {
        scoreRecord[category] += w;
        if (!hitRecord[category].includes(term)) hitRecord[category].push(term);
      }
    });
  });

  return { scores: scoreRecord, hits: hitRecord };
}

function visionScores(input: AnalyzeInput): {
  scores: Record<CategoryId, number>;
  used: boolean;
  quality: "strong" | "weak" | "none";
  label: string;
} {
  const empty = {
    garbage: 0,
    water: 0,
    roads: 0,
    lighting: 0,
    food: 0,
    infrastructure: 0,
  } satisfies Record<CategoryId, number>;

  const sample = input.imageSampleKey ? SAMPLE_VISION[input.imageSampleKey] : null;
  if (sample) {
    const scores = { ...empty };
    (Object.keys(sample) as CategoryId[]).forEach((key) => {
      scores[key] = sample[key] ?? 0;
    });
    return {
      scores,
      used: true,
      quality: "strong",
      label: `Demo vision classifier · frame "${input.imageSampleKey}"`,
    };
  }

  const f = input.imageFeatures;
  if (!f) {
    return { scores: empty, used: false, quality: "none", label: "No image signals" };
  }

  const scores = { ...empty };
  scores.lighting += Math.max(0, 0.62 - f.brightness) * 1.6;
  scores.roads += Math.max(0, f.grayness - 0.35) * 0.9 + Math.max(0, 0.3 - f.greenness) * 0.5;
  scores.garbage += Math.max(0, 0.42 - f.brightness) * 0.7 + Math.max(0, f.saturation - 0.32) * 0.4;
  scores.water += Math.max(0, 0.25 - f.saturation) * 0.8 + f.greenness * 0.5;
  scores.food += f.saturation > 0.45 ? 0.35 : 0;
  scores.infrastructure += Math.max(0, f.grayness - 0.5) * 0.8;

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;
  (Object.keys(scores) as CategoryId[]).forEach((key) => {
    scores[key] = scores[key] / total;
  });

  return {
    scores,
    used: true,
    quality: "weak",
    label: "Device vision heuristic · brightness, colour and edge density",
  };
}

function toWeights(
  scores: Record<CategoryId, number>,
  mapper: (value: number) => number,
): SignalWeight[] {
  return (Object.entries(scores) as [CategoryId, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, value]) => ({ label: categoryMeta(key).short, weight: mapper(value) }));
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function jaccard(a: string, b: string): number {
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  setA.forEach((token) => {
    if (setB.has(token)) shared += 1;
  });
  return shared / (setA.size + setB.size - shared);
}

function trigrams(value: string): Set<string> {
  const clean = normalise(value).replace(/\s/g, "_");
  const set = new Set<string>();
  for (let i = 0; i < clean.length - 2; i += 1) set.add(clean.slice(i, i + 3));
  return set;
}

function trigramDice(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  A.forEach((gram) => {
    if (B.has(gram)) shared += 1;
  });
  return (2 * shared) / (A.size + B.size);
}

function geoScore(distanceMeters: number): number {
  if (distanceMeters <= 80) return 1;
  if (distanceMeters <= 300) return 0.78;
  if (distanceMeters <= 900) return 0.42;
  if (distanceMeters <= 2500) return 0.15;
  return 0;
}

export function findDuplicates(
  input: AnalyzeInput,
  category: CategoryId,
  existing: ExistingReport[],
): DuplicateMatch[] {
  const haystackTitle = input.title ?? "";
  const haystackBody = input.description ?? "";
  const hasGeo = typeof input.lat === "number" && typeof input.lng === "number";

  return existing
    .map((report) => {
      const textSim =
        0.5 * jaccard(`${haystackTitle} ${haystackBody}`, `${report.title} ${report.description}`) +
        0.5 * trigramDice(`${haystackTitle} ${haystackBody}`, `${report.title} ${report.description}`);
      const distanceMeters =
        hasGeo && typeof report.lat === "number"
          ? haversine(input.lat as number, input.lng as number, report.lat, report.lng)
          : 4000;
      const sameCategory = report.category === category;
      const categoryBoost = sameCategory ? 0.12 : 0;
      const distanceFactor = geoScore(distanceMeters);
      const raw = Math.min(0.99, textSim * 0.66 + distanceFactor * 0.28 + categoryBoost);
      const similarity = Math.round(Math.max(0.06, Math.min(0.98, raw)) * 100);
      const nearest =
        distanceMeters < 120
          ? "within 120 m"
          : distanceMeters < 1000
            ? `about ${Math.round(distanceMeters / 10) * 10} m away`
            : `about ${(distanceMeters / 1000).toFixed(1)} km away`;
      const reasonParts = [
        sameCategory ? "same predicted category" : "different category",
        textSim > 0.3 ? "strong wording overlap" : "loosely similar wording",
        distanceMeters <= 900 ? nearest : "different neighbourhood",
      ];
      return {
        id: report.id,
        reference: report.reference,
        title: report.title,
        category: report.category,
        status: report.status as DuplicateMatch["status"],
        neighbourhood: report.neighbourhood,
        similarity,
        distanceMeters,
        reason: reasonParts.join(" · "),
      };
    })
    .filter((match) => match.similarity >= 42)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

export function analyzeProblem(
  input: AnalyzeInput,
  existing: ExistingReport[] = [],
): AnalysisResult {
  const combinedText = `${input.title ?? ""} ${input.description ?? ""}`.trim();
  const { scores: rawText, hits } = textScores(combinedText);
  const vision = visionScores(input);
  const language = detectLanguage(combinedText, input.language ?? "en");

  const textTotal = Object.values(rawText).reduce((sum, value) => sum + value, 0);
  const normalisedText = { ...rawText };
  if (textTotal > 0) {
    (Object.keys(normalisedText) as CategoryId[]).forEach((key) => {
      normalisedText[key] = normalisedText[key] / textTotal;
    });
  }

  const textDensity = Math.min(1, tokens(combinedText).length / 12);
  let textWeight = textTotal > 0 ? 0.45 + 0.35 * textDensity : 0;
  let visionWeight = vision.used ? (vision.quality === "strong" ? 0.55 : 0.22) : 0;
  if (!vision.used) textWeight = 1;
  if (textTotal === 0 && !vision.used) {
    textWeight = 0;
    visionWeight = 0;
  }
  const totalWeight = textWeight + visionWeight || 1;

  const combined = {} as Record<CategoryId, number>;
  (Object.keys(rawText) as CategoryId[]).forEach((key) => {
    combined[key] =
      (normalisedText[key] * textWeight + (vision.scores[key] ?? 0) * visionWeight) /
      totalWeight;
  });

  const ranked = (Object.entries(combined) as [CategoryId, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [topCategory, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const margin = Math.max(0, topScore - secondScore);

  const confidence = Math.round(
    Math.max(
      46,
      Math.min(
        97,
        56 +
          topScore * 26 +
          margin * 46 +
          (vision.quality === "strong" ? 6 : vision.quality === "weak" ? 1 : 0) +
          (hits[topCategory].length >= 3 ? 4 : 0),
      ),
    ),
  );

  const severityHits = SEVERITY_TERMS.filter(({ term }) =>
    combinedText.toLowerCase().includes(normalise(term)),
  );
  const severityScore = severityHits.reduce((sum, item) => sum + item.w, 0);
  const duplicateCount = input.duplicateCount ?? 0;
  const isMainRoad = /main road|junction|market|crossing|school|hospital/.test(
    combinedText.toLowerCase(),
  );
  const geoAdjust = isMainRoad ? 6 : 0;
  const priorityScore = Math.round(
    Math.max(
      8,
      Math.min(
        97,
        BASE_RISK[topCategory] +
          severityScore * 1.35 +
          duplicateCount * 6 +
          geoAdjust +
          (confidence > 85 ? 3 : 0),
      ),
    ),
  );
  const priority: Priority = priorityScore >= 66 ? "high" : priorityScore >= 42 ? "medium" : "low";
  const meta = categoryMeta(topCategory);

  const duplicateCandidates = findDuplicates(input, topCategory, existing);
  const duplicateVerdict: AnalysisResult["duplicateVerdict"] =
    duplicateCandidates[0]?.similarity && duplicateCandidates[0].similarity >= 78
      ? "likely_duplicate"
      : duplicateCandidates[0]?.similarity && duplicateCandidates[0].similarity >= 58
        ? "linked"
        : "new";

  const severityLabels = Array.from(new Set(severityHits.map((item) => item.label))).slice(0, 4);
  const matchedKeywords = hits[topCategory].slice(0, 4);
  const place = input.address || input.neighbourhood || "your neighbourhood";

  const priorityReason = [
    `${meta.short} reports begin at ${meta.basePriority} baseline risk.`,
    severityLabels.length
      ? `Escalated for ${severityLabels.join(", ")}.`
      : "No immediate safety keywords were detected.",
    duplicateCount > 0
      ? `${duplicateCount} resident(s) reported the same issue, raising its community weight.`
      : `${confidence}% category confidence from ${vision.quality === "strong" ? "vision + text" : vision.quality === "weak" ? "device vision + text" : "text"} signals.`,
    input.imageSampleKey ? "Vision model identified the damage pattern in the photo." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const summary = `${meta.short} issue detected near ${place}. ${
    severityLabels.length ? `Key risk signals: ${severityLabels.join(", ")}. ` : ""
  }${duplicateCount > 0 ? `${duplicateCount} nearby report(s) appear to describe the same problem, so they should be tracked together. ` : ""}Suggested route: ${meta.department} (${meta.sla} guideline).`;

  const recommendations: Recommendation[] = [
    ...(duplicateCandidates.length
      ? [
          {
            title: "Join the existing thread",
            detail: `Report ${duplicateCandidates[0].reference} looks ${duplicateCandidates[0].similarity}% similar. Confirm it instead of filing a new ticket so crews see one strong signal.`,
            owner: "Community",
          },
        ]
      : []),
    ...RECOMMENDATIONS[topCategory],
  ].slice(0, 4);

  const tags = Array.from(
    new Set([
      meta.short.toLowerCase(),
      ...severityLabels.slice(0, 2),
      ...(duplicateCandidates.length ? ["possible duplicate"] : []),
      ...(hits[topCategory].length ? ["text matched"] : []),
      ...(vision.quality === "strong" ? ["vision matched"] : []),
    ]),
  ).slice(0, 5);

  return {
    category: topCategory,
    categoryLabel: meta.label,
    confidence,
    priority,
    priorityScore,
    priorityReason,
    summary,
    tags,
    recommendations,
    responsibleDepartment: meta.department,
    expectedResponse: priority === "high" ? "Within 24 hours" : meta.sla,
    duplicates: duplicateCandidates,
    duplicateVerdict,
    signals: {
      text: toWeights(normalisedText, (value) => Math.round(value * 100)),
      vision: toWeights(vision.scores, (value) => Math.round(value * 100)),
      severity: severityLabels,
      geo: isMainRoad ? "High-traffic landmark detected in text" : "Standard location weighting",
      language,
      reasoning: [
        `Text model matched ${hits[topCategory].length} category terms${
          matchedKeywords.length ? ` (${matchedKeywords.join(", ")})` : ""
        }.`,
        `Vision module: ${vision.label}${vision.used ? "" : " — predictions fall back to text"}.`,
        `Priority is a suggestion, not a verified fact. A human can override category and priority.`,
      ].join(" "),
    },
    modelVersion: "lifeloop-vision-2.1",
    imageQuality: vision.quality,
  };
}

export const AI_CATEGORY_GUIDE = CATEGORY_HINTS;
