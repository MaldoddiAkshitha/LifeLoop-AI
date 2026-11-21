export type CategoryId =
  | "garbage"
  | "water"
  | "roads"
  | "lighting"
  | "food"
  | "infrastructure";

export type Priority = "low" | "medium" | "high";
export type ReportStatus = "open" | "in_progress" | "resolved";
export type LanguageCode = "en" | "hi" | "es" | "fr" | "sw" | "ar";

export type Recommendation = {
  title: string;
  detail: string;
  owner: string;
};

export type SignalWeight = {
  label: string;
  weight: number;
};

export type AiSignals = {
  text: SignalWeight[];
  vision: SignalWeight[];
  severity: string[];
  geo: string;
  language: string;
  reasoning: string;
};

export type DuplicateMatch = {
  id: number;
  reference: string;
  title: string;
  category: CategoryId;
  status: ReportStatus;
  neighbourhood: string;
  similarity: number;
  distanceMeters: number;
  reason: string;
};

export type AnalysisResult = {
  category: CategoryId;
  categoryLabel: string;
  confidence: number;
  priority: Priority;
  priorityScore: number;
  priorityReason: string;
  summary: string;
  tags: string[];
  recommendations: Recommendation[];
  responsibleDepartment: string;
  expectedResponse: string;
  duplicates: DuplicateMatch[];
  duplicateVerdict: "new" | "likely_duplicate" | "linked";
  signals: AiSignals;
  modelVersion: string;
  imageQuality: "strong" | "weak" | "none";
};

export type CategoryMeta = {
  id: CategoryId;
  label: string;
  short: string;
  blurb: string;
  department: string;
  sla: string;
  basePriority: Priority;
  image: string;
  count: number;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "garbage",
    label: "Garbage accumulation",
    short: "Garbage",
    blurb: "Overflowing bins, illegal dumping and uncollected waste.",
    department: "Waste Management Cell",
    sla: "24 hours",
    basePriority: "medium",
    image:
      "https://images.pexels.com/photos/6316243/pexels-photo-6316243.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
  {
    id: "water",
    label: "Water leakage",
    short: "Water",
    blurb: "Burst pipes, leaking hydrants and continuous wastage.",
    department: "Water Supply Board",
    sla: "12 hours",
    basePriority: "high",
    image:
      "https://images.pexels.com/photos/4406597/pexels-photo-4406597.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
  {
    id: "roads",
    label: "Road damage",
    short: "Roads",
    blurb: "Potholes, cracked pavements and dangerous road edges.",
    department: "Public Works Department",
    sla: "48 hours",
    basePriority: "medium",
    image:
      "https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
  {
    id: "lighting",
    label: "Streetlight failure",
    short: "Lighting",
    blurb: "Dark stretches, broken lamps and unlit pedestrian paths.",
    department: "Electrical & Lighting Wing",
    sla: "36 hours",
    basePriority: "high",
    image:
      "https://images.pexels.com/photos/9809601/pexels-photo-9809601.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
  {
    id: "food",
    label: "Food wastage",
    short: "Food",
    blurb: "Surplus meals thrown away instead of being redistributed.",
    department: "Community Food Network",
    sla: "6 hours",
    basePriority: "medium",
    image:
      "https://images.pexels.com/photos/36593268/pexels-photo-36593268.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
  {
    id: "infrastructure",
    label: "Public infrastructure",
    short: "Infrastructure",
    blurb: "Damaged benches, bus stops, drains, signs and public utilities.",
    department: "Civic Assets Team",
    sla: "72 hours",
    basePriority: "low",
    image:
      "https://images.pexels.com/photos/11658940/pexels-photo-11658940.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    count: 0,
  },
];

export function categoryMeta(id: string): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; hint: string; className: string }
> = {
  high: {
    label: "High priority",
    hint: "Safety or health risk — act within 24 hours",
    className: "text-rose-700 bg-rose-50 border-rose-200",
  },
  medium: {
    label: "Medium priority",
    hint: "Needs attention this week",
    className: "text-amber-800 bg-amber-50 border-amber-200",
  },
  low: {
    label: "Low priority",
    hint: "Routine maintenance queue",
    className: "text-emerald-800 bg-emerald-50 border-emerald-200",
  },
};

export const STATUS_META: Record<
  ReportStatus,
  { label: string; className: string; dot: string }
> = {
  open: {
    label: "Open",
    className: "text-rose-700 bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
  },
  in_progress: {
    label: "In progress",
    className: "text-amber-800 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    className: "text-emerald-800 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
  { code: "ar", label: "Arabic", native: "العربية" },
];

export const NEIGHBOURHOODS: {
  id: string;
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}[] = [
  { id: "old-town", name: "Old Town", lat: 12.9775, lng: 77.5865, x: 30, y: 34 },
  { id: "riverside", name: "Riverside", lat: 12.9678, lng: 77.6032, x: 63, y: 52 },
  { id: "green-park", name: "Green Park", lat: 12.9838, lng: 77.6038, x: 58, y: 22 },
  { id: "market-quarter", name: "Market Quarter", lat: 12.9712, lng: 77.5798, x: 17, y: 55 },
  { id: "lakeview", name: "Lakeview", lat: 12.9582, lng: 77.5855, x: 27, y: 76 },
  { id: "northgate", name: "Northgate", lat: 12.9908, lng: 77.5885, x: 38, y: 12 },
  { id: "tech-park", name: "Tech Park", lat: 12.9612, lng: 77.6128, x: 82, y: 68 },
  { id: "sunrise-colony", name: "Sunrise Colony", lat: 12.9852, lng: 77.5748, x: 9, y: 18 },
];

export type ReportRecord = {
  id: number;
  reference: string;
  reporterId: number | null;
  reporterName: string | null;
  reporterHandle: string | null;
  reporterTone: string | null;
  title: string;
  description: string;
  language: string;
  category: CategoryId;
  aiCategory: CategoryId;
  aiConfidence: number;
  priority: Priority;
  priorityScore: number;
  priorityReason: string;
  status: ReportStatus;
  neighbourhood: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  aiSummary: string;
  tags: string[];
  recommendations: Recommendation[];
  signals: AiSignals | null;
  responsibleDepartment: string;
  expectedResponse: string;
  duplicateOfId: number | null;
  duplicateCount: number;
  upvotes: number;
  verifications: number;
  categoryCorrected: boolean;
  modelVersion: string;
  impactPoints: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type ReportUpdateRecord = {
  id: number;
  reportId: number;
  kind: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string;
  actorName: string | null;
  createdAt: string;
};

export type LeaderRecord = {
  id: number;
  name: string;
  handle: string;
  neighbourhood: string;
  role: string;
  points: number;
  reportsCount: number;
  resolvedCount: number;
  tone: string;
};

export type PlatformStats = {
  totalReports: number;
  resolved: number;
  inProgress: number;
  open: number;
  highPriority: number;
  duplicatesGrouped: number;
  neighbours: number;
  avgResolutionHours: number;
  impactPoints: number;
  resolutionRate: number;
  byCategory: { category: CategoryId; count: number; resolved: number }[];
  byNeighbourhood: {
    id: string;
    name: string;
    x: number;
    y: number;
    open: number;
    resolved: number;
    total: number;
    highPriority: number;
    categories: Record<string, number>;
  }[];
  trend: { date: string; reported: number; resolved: number }[];
};
