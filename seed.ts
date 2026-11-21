import { sql } from "drizzle-orm";
import { db } from "@/db";
import { reportUpdates, reports, users } from "@/db/schema";
import { analyzeProblem } from "@/lib/ai";
import {
  CATEGORIES,
  NEIGHBOURHOODS,
  type CategoryId,
  type Priority,
  type ReportStatus,
} from "@/lib/types";

type SeedUser = {
  name: string;
  handle: string;
  neighbourhood: string;
  role: string;
  tone: string;
};

const SEED_USERS: SeedUser[] = [
  {
    name: "Aisha Rahman",
    handle: "aisha",
    neighbourhood: "Old Town",
    role: "Community moderator",
    tone: "emerald",
  },
  {
    name: "Daniel Okoye",
    handle: "daniel",
    neighbourhood: "Riverside",
    role: "Resident",
    tone: "sky",
  },
  {
    name: "Priya Nair",
    handle: "priya",
    neighbourhood: "Green Park",
    role: "Resident",
    tone: "violet",
  },
  {
    name: "Marco Silva",
    handle: "marco",
    neighbourhood: "Market Quarter",
    role: "Shopkeeper",
    tone: "amber",
  },
  {
    name: "Fatima Ali",
    handle: "fatima",
    neighbourhood: "Lakeview",
    role: "Resident",
    tone: "rose",
  },
  {
    name: "Chen Wei",
    handle: "chen",
    neighbourhood: "Tech Park",
    role: "Volunteer mapper",
    tone: "teal",
  },
  {
    name: "Grace Mwangi",
    handle: "grace",
    neighbourhood: "Northgate",
    role: "Resident",
    tone: "lime",
  },
  {
    name: "Rahul Menon",
    handle: "rahul",
    neighbourhood: "Sunrise Colony",
    role: "Student",
    tone: "orange",
  },
];

type SeedReport = {
  title: string;
  description: string;
  category: CategoryId;
  aiCategory?: CategoryId;
  status: ReportStatus;
  priority?: Priority;
  neighbourhood: string;
  address: string;
  reporter: number;
  daysAgo: number;
  resolvedHours?: number;
  upvotes: number;
  verifications: number;
  group?: string;
  imageKey?: string;
  language?: string;
  note?: string;
};

const SEED_REPORTS: SeedReport[] = [
  {
    title: "Overflowing bins outside Old Town market",
    description:
      "The community bin behind the vegetable market has not been emptied for four days. Waste is spilling onto the pavement, plastic is blowing into the drain and there is a strong smell. Children walk past this spot on their way to school every morning.",
    category: "garbage",
    status: "in_progress",
    priority: "high",
    neighbourhood: "Old Town",
    address: "12 Temple Street, by the vegetable stalls",
    reporter: 0,
    daysAgo: 9,
    upvotes: 34,
    verifications: 16,
    group: "old-town-bins",
    imageKey: "garbage",
  },
  {
    title: "Garbage piling up at Temple Street market",
    description:
      "The same garbage pile at Temple Street market is now bigger. Bins are overflowing and stray dogs are tearing the bags open. Waste is spreading across the walking path.",
    category: "garbage",
    status: "open",
    neighbourhood: "Old Town",
    address: "Temple Street market entrance",
    reporter: 3,
    daysAgo: 7,
    upvotes: 18,
    verifications: 9,
    group: "old-town-bins",
    imageKey: "garbage",
  },
  {
    title: "Waste dumped beside Old Town bus bay",
    description:
      "People keep dumping bags next to the bus bay because the market bins are full. It smells badly and there are flies all over the waiting area.",
    category: "garbage",
    status: "in_progress",
    neighbourhood: "Old Town",
    address: "Old Town bus bay, platform 2",
    reporter: 6,
    daysAgo: 5,
    upvotes: 12,
    verifications: 7,
    group: "old-town-bins",
    imageKey: "garbage",
  },
  {
    title: "Water gushing from broken pipeline on Riverside Walk",
    description:
      "A pipe next to the riverside jogging path has been leaking continuously since Tuesday. Water is pooling on the walkway and running into the storm drain. Hundreds of litres are being wasted every hour.",
    category: "water",
    status: "in_progress",
    priority: "high",
    neighbourhood: "Riverside",
    address: "Riverside Walk, 200 m from the boat jetty",
    reporter: 1,
    daysAgo: 3,
    upvotes: 41,
    verifications: 22,
    group: "riverside-leak",
    imageKey: "water",
  },
  {
    title: "Continuous water leak wasting water near footbridge",
    description:
      "There is a leak on the pipe beside the footbridge. Water has been flowing for two days and the path is slippery for joggers and cyclists.",
    category: "water",
    status: "open",
    neighbourhood: "Riverside",
    address: "Pedestrian footbridge, Riverside",
    reporter: 4,
    daysAgo: 2,
    upvotes: 16,
    verifications: 8,
    group: "riverside-leak",
    imageKey: "water",
  },
  {
    title: "Burst water line flooding Green Park lane",
    description:
      "Water is bubbling up through the road near the Green Park community hall. The lane is flooded and children cannot cross to the playground. Parents are worried about an accident near the school gate.",
    category: "water",
    status: "open",
    priority: "high",
    neighbourhood: "Green Park",
    address: "Green Park community hall lane",
    reporter: 2,
    daysAgo: 1,
    upvotes: 27,
    verifications: 14,
    imageKey: "water",
  },
  {
    title: "Deep pothole on Old Town main road",
    description:
      "A deep pothole has formed at the junction near the clock tower, exactly where children cross to school. Two scooters slipped here yesterday evening and at night the hole is invisible.",
    category: "roads",
    status: "resolved",
    priority: "high",
    neighbourhood: "Old Town",
    address: "Clock tower junction, Old Town main road",
    reporter: 0,
    daysAgo: 12,
    resolvedHours: 30,
    upvotes: 52,
    verifications: 28,
    group: "pothole-junction",
    imageKey: "roads",
    note: "Hot-mix patching completed and the junction has been re-marked. Thank you for the precise photo.",
  },
  {
    title: "Potholes at clock tower junction still not fixed",
    description:
      "The potholes at the clock tower junction are getting deeper after the rain. Traffic swerves into the opposite lane to avoid them, and cyclists are at risk.",
    category: "roads",
    status: "open",
    neighbourhood: "Old Town",
    address: "Clock tower junction",
    reporter: 7,
    daysAgo: 10,
    upvotes: 21,
    verifications: 11,
    group: "pothole-junction",
    imageKey: "roads",
  },
  {
    title: "Cracked pavement outside Sunrise Colony clinic",
    description:
      "The pavement outside the clinic is cracked and lifted by tree roots. An elderly resident tripped last week and the footpath is too uneven for wheelchairs.",
    category: "roads",
    status: "open",
    neighbourhood: "Sunrise Colony",
    address: "Sunrise Colony health clinic, gate 1",
    reporter: 7,
    daysAgo: 2,
    upvotes: 14,
    verifications: 6,
    imageKey: "roads",
  },
  {
    title: "Road edge collapsing after rain on Lakeview road",
    description:
      "The edge of the road near the lake has collapsed after the rain. Half of the left lane is gone and there is no warning sign for night traffic.",
    category: "roads",
    status: "in_progress",
    priority: "high",
    neighbourhood: "Lakeview",
    address: "Lakeview ring road, near boat club",
    reporter: 4,
    daysAgo: 6,
    upvotes: 33,
    verifications: 17,
    imageKey: "roads",
  },
  {
    title: "Streetlight out on the Riverside Walk stretch",
    description:
      "Three streetlights between the boat jetty and the footbridge have been dark for over a week. Women walking home after 8pm are using phone torches, and the night patrol says the stretch is unsafe.",
    category: "lighting",
    status: "open",
    priority: "high",
    neighbourhood: "Riverside",
    address: "Riverside Walk, poles 14 to 16",
    reporter: 1,
    daysAgo: 4,
    upvotes: 38,
    verifications: 19,
    imageKey: "lighting",
  },
  {
    title: "सड़क की लाइट तीन दिन से बंद है",
    description:
      "नॉर्थगेट की गली में तीन दिन से स्ट्रीट लाइट बंद है। रात में बहुत अंधेरा रहता है और बच्चे और बुजुर्ग सड़क पार करने में डरते हैं। कृपया जल्दी ठीक करवाइए।",
    category: "lighting",
    status: "in_progress",
    neighbourhood: "Northgate",
    address: "Northgate 4th cross, near the flats",
    reporter: 6,
    daysAgo: 8,
    upvotes: 19,
    verifications: 12,
    imageKey: "lighting",
    language: "hi",
  },
  {
    title: "Leaning lamp post could fall on pedestrians",
    description:
      "The lamp post outside the Green Park school gate is leaning badly after the storm. The base is rusted and the pole hangs over the pavement. Children wait there every afternoon and it looks dangerous.",
    category: "infrastructure",
    aiCategory: "lighting",
    status: "open",
    priority: "high",
    neighbourhood: "Green Park",
    address: "Green Park school gate, 3rd avenue",
    reporter: 2,
    daysAgo: 1,
    upvotes: 23,
    verifications: 10,
    imageKey: "infrastructure",
  },
  {
    title: "Wedding caterer has surplus meals going to waste",
    description:
      "A caterer near the market has about 60 surplus vegetarian meals after an event. The kitchen will throw them away by 10pm unless a redistribution volunteer can collect them. Food is fresh and packed.",
    category: "food",
    status: "open",
    priority: "high",
    neighbourhood: "Market Quarter",
    address: "Market Quarter, lane 4 kitchen",
    reporter: 3,
    daysAgo: 1,
    upvotes: 31,
    verifications: 13,
    imageKey: "food",
  },
  {
    title: "Canteen throwing away cooked rice every evening",
    description:
      "The office canteen throws away around 8kg of cooked rice and curry every evening. Staff want to connect with a food bank for a daily pickup instead of dumping it in the wet waste bin.",
    category: "food",
    status: "resolved",
    neighbourhood: "Tech Park",
    address: "Tech Park tower B canteen",
    reporter: 5,
    daysAgo: 11,
    resolvedHours: 10,
    upvotes: 26,
    verifications: 15,
    group: "tech-food",
    imageKey: "food",
    note: "Food bank matched. Pickup runs daily at 8:30pm and 42 kg of food has been redirected so far.",
  },
  {
    title: "Surplus food from food court being binned",
    description:
      "The food court at Tech Park bins trays of unsold meals each night. Volunteers nearby could collect if there was a simple pickup schedule.",
    category: "food",
    status: "resolved",
    neighbourhood: "Tech Park",
    address: "Tech Park food court, level 1",
    reporter: 4,
    daysAgo: 9,
    resolvedHours: 12,
    upvotes: 17,
    verifications: 8,
    group: "tech-food",
    imageKey: "food",
    note: "Merged into the canteen pickup programme after duplicate review.",
  },
  {
    title: "Broken bus shelter at Market Quarter stop",
    description:
      "The roof of the bus shelter outside the market is broken and hanging down. Commuters stand in the rain and the sharp metal edge is at head height.",
    category: "infrastructure",
    status: "in_progress",
    neighbourhood: "Market Quarter",
    address: "Market Quarter bus stop, main road",
    reporter: 3,
    daysAgo: 5,
    upvotes: 22,
    verifications: 9,
    imageKey: "infrastructure",
  },
  {
    title: "Playground swing broken in Green Park",
    description:
      "One of the swings in the Green Park playground has a broken chain and the seat is hanging loose. Kids still try to use it and there is a risk of injury.",
    category: "infrastructure",
    status: "open",
    neighbourhood: "Green Park",
    address: "Green Park playground",
    reporter: 2,
    daysAgo: 3,
    upvotes: 20,
    verifications: 11,
    imageKey: "infrastructure",
  },
  {
    title: "Broken park benches near Lakeview pond",
    description:
      "Two benches near the pond have broken planks. Elderly walkers use them to rest and one person already hurt their hand on a splinter.",
    category: "infrastructure",
    status: "resolved",
    neighbourhood: "Lakeview",
    address: "Lakeview pond promenade",
    reporter: 4,
    daysAgo: 14,
    resolvedHours: 40,
    upvotes: 15,
    verifications: 7,
    imageKey: "infrastructure",
    note: "Both benches replaced with recycled-plastic slats by the civic assets crew.",
  },
  {
    title: "Open drain cover missing near Northgate bus stop",
    description:
      "The concrete cover of the storm drain is missing near the Northgate bus stop. The open pit is more than a metre deep and children could fall in. A traffic cone is the only warning.",
    category: "infrastructure",
    status: "open",
    priority: "high",
    neighbourhood: "Northgate",
    address: "Northgate bus stop, opposite the pharmacy",
    reporter: 6,
    daysAgo: 2,
    upvotes: 40,
    verifications: 21,
    imageKey: "infrastructure",
  },
  {
    title: "Public toilet blocked at Riverside park",
    description:
      "The public toilet near the riverside park is blocked and overflowing. Visitors and walkers have no option nearby, and the smell is spreading across the park.",
    category: "water",
    status: "in_progress",
    priority: "high",
    neighbourhood: "Riverside",
    address: "Riverside park public toilet",
    reporter: 1,
    daysAgo: 6,
    upvotes: 24,
    verifications: 12,
    imageKey: "water",
  },
  {
    title: "Illegal dumping at Market Quarter corner",
    description:
      "A large pile of construction waste and rubbish has been dumped at the street corner. It is blocking half the footpath and spreading into the gutter.",
    category: "garbage",
    status: "resolved",
    neighbourhood: "Market Quarter",
    address: "Market Quarter, corner of lane 2",
    reporter: 3,
    daysAgo: 16,
    resolvedHours: 18,
    upvotes: 29,
    verifications: 15,
    group: "market-dump",
    imageKey: "garbage",
    note: "Dumped material cleared and a no-dumping board installed.",
  },
  {
    title: "Dump next to Market Quarter corner has returned",
    description:
      "The same corner has fresh rubbish bags and broken furniture. The pile is smaller than before but growing again each night.",
    category: "garbage",
    status: "resolved",
    neighbourhood: "Market Quarter",
    address: "Market Quarter, corner of lane 2",
    reporter: 7,
    daysAgo: 13,
    resolvedHours: 20,
    upvotes: 13,
    verifications: 6,
    group: "market-dump",
    imageKey: "garbage",
    note: "Cleared by the market sanitation team, linked to the earlier report.",
  },
  {
    title: "Damaged road sign hidden by tree at Tech Park entrance",
    description:
      "The one-way sign at the Tech Park entrance is bent and hidden by a tree branch. Drivers keep entering the wrong way during school pickup hours, which is dangerous.",
    category: "infrastructure",
    status: "open",
    neighbourhood: "Tech Park",
    address: "Tech Park main entrance junction",
    reporter: 5,
    daysAgo: 4,
    upvotes: 9,
    verifications: 4,
    imageKey: "infrastructure",
  },
  {
    title: "Takataka nyingi karibu na soko",
    description:
      "There is a lot of uncollected rubbish near the Sunrise Colony market. The bins are overflowing, waste is everywhere and the smell is very bad. Children are playing next to the pile.",
    category: "garbage",
    status: "open",
    neighbourhood: "Sunrise Colony",
    address: "Sunrise Colony market square",
    reporter: 7,
    daysAgo: 0,
    upvotes: 11,
    verifications: 5,
    imageKey: "garbage",
    language: "sw",
  },
];

function jitterLatLng(neighbourhoodId: string, index: number) {
  const base = NEIGHBOURHOODS.find((item) => item.id === neighbourhoodId) ?? NEIGHBOURHOODS[0];
  const delta = ((index % 5) - 2) * 0.0006;
  const cross = ((index % 3) - 1) * 0.0007;
  return { lat: base.lat + delta, lng: base.lng + cross };
}

function neighbourhoodIdFromName(name: string): string {
  return NEIGHBOURHOODS.find((n) => n.name === name)?.id ?? NEIGHBOURHOODS[0].id;
}

const HOUR = 60 * 60 * 1000;

export async function ensureSeeded(): Promise<void> {
  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  if ((existing[0]?.count ?? 0) > 0) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(918273645)`);
    const check = await tx.select({ count: sql<number>`count(*)::int` }).from(users);
    if ((check[0]?.count ?? 0) > 0) return;

    const insertedUsers = await tx
      .insert(users)
      .values(SEED_USERS.map((user) => ({ ...user, points: 0 })))
      .returning({ id: users.id });

    const imageFor = (key: string | undefined, category: CategoryId) =>
      CATEGORIES.find((c) => c.id === (key ?? category))?.image ?? CATEGORIES[0].image;

    const created: {
      id: number;
      reporterIndex: number;
      status: ReportStatus;
      resolved: boolean;
      group?: string;
    }[] = [];
    const groupCanonical = new Map<string, number>();
    const reportCreationDates: Date[] = [];

    for (let index = 0; index < SEED_REPORTS.length; index += 1) {
      const item = SEED_REPORTS[index];
      const neighbourhoodId = neighbourhoodIdFromName(item.neighbourhood);
      const { lat, lng } = jitterLatLng(neighbourhoodId, index);
      const createdAt = new Date(Date.now() - item.daysAgo * 24 * HOUR - (index % 6) * HOUR);
      const ai = analyzeProblem(
        {
          title: item.title,
          description: item.description,
          language: item.language ?? "en",
          neighbourhood: item.neighbourhood,
          address: item.address,
          lat,
          lng,
          imageSampleKey: item.imageKey ?? item.category,
        },
        [],
      );
      const resolvedAt =
        item.status === "resolved"
          ? new Date(createdAt.getTime() + (item.resolvedHours ?? 24) * HOUR)
          : null;
      const canonical = item.group ? groupCanonical.get(item.group) : undefined;

      const [row] = await tx
        .insert(reports)
        .values({
          reference: `LL-${1024 + index}`,
          reporterId: insertedUsers[item.reporter].id,
          title: item.title,
          description: item.description,
          language: ai.signals.language,
          category: item.category,
          aiCategory: item.aiCategory ?? ai.category,
          aiConfidence: ai.confidence / 100,
          priority: item.priority ?? ai.priority,
          priorityScore: ai.priorityScore,
          priorityReason: ai.priorityReason,
          status: item.status,
          neighbourhood: item.neighbourhood,
          address: item.address,
          lat,
          lng,
          imageUrl: imageFor(item.imageKey, item.category),
          aiSummary: ai.summary,
          tags: ai.tags,
          recommendations: ai.recommendations,
          signals: ai.signals,
          duplicateCandidates: [],
          responsibleDepartment: ai.responsibleDepartment,
          expectedResponse: ai.expectedResponse,
          duplicateOfId: canonical ?? null,
          duplicateCount: 0,
          upvotes: item.upvotes,
          verifications: item.verifications,
          categoryCorrected: Boolean(item.aiCategory && item.aiCategory !== item.category),
          modelVersion: ai.modelVersion,
          impactPoints: 10 + (item.status === "resolved" ? 25 : 0),
          createdAt,
          updatedAt: resolvedAt ?? createdAt,
          resolvedAt,
        })
        .returning({ id: reports.id });

      if (item.group && !canonical) groupCanonical.set(item.group, row.id);

      await tx.insert(reportUpdates).values({
        reportId: row.id,
        userId: insertedUsers[item.reporter].id,
        kind: "ai",
        toStatus: "open",
        note: `Report received. AI predicted ${ai.categoryLabel} at ${ai.confidence}% confidence with ${ai.priority} priority.`,
        createdAt,
      });

      if (item.status !== "open") {
        await tx.insert(reportUpdates).values({
          reportId: row.id,
          userId: insertedUsers[0].id,
          kind: "status",
          fromStatus: "open",
          toStatus: "in_progress",
          note: `Assigned to ${ai.responsibleDepartment} and verified by the community desk.`,
          createdAt: new Date(createdAt.getTime() + 4 * HOUR),
        });
      }

      if (item.status === "resolved" && resolvedAt) {
        await tx.insert(reportUpdates).values({
          reportId: row.id,
          userId: insertedUsers[0].id,
          kind: "status",
          fromStatus: "in_progress",
          toStatus: "resolved",
          note: item.note ?? "Work completed on site and confirmed by a community verifier.",
          createdAt: resolvedAt,
        });
      }

      created.push({
        id: row.id,
        reporterIndex: item.reporter,
        status: item.status,
        resolved: item.status === "resolved",
        group: item.group,
      });
      reportCreationDates.push(createdAt);
    }

    // Link duplicates to their canonical report and count group size.
    const groupedCounts = new Map<number, number>();
    for (const report of created) {
      if (!report.group) continue;
      const canonicalId = groupCanonical.get(report.group);
      if (!canonicalId) continue;
      groupedCounts.set(canonicalId, (groupedCounts.get(canonicalId) ?? 0) + 1);
    }
    for (const [canonicalId, count] of groupedCounts.entries()) {
      if (count <= 0) continue;
      await tx
        .update(reports)
        .set({ duplicateCount: count })
        .where(sql`${reports.id} = ${canonicalId}`);
      await tx.insert(reportUpdates).values({
        reportId: canonicalId,
        userId: insertedUsers[0].id,
        kind: "duplicate",
        note: `Duplicate intelligence grouped ${count} similar report(s) with this thread.`,
        createdAt: new Date(),
      });
    }

    // Recompute contributor impact from activity.
    for (let index = 0; index < insertedUsers.length; index += 1) {
      const mine = created.filter((report) => report.reporterIndex === index);
      const resolved = mine.filter((report) => report.resolved).length;
      await tx
        .update(users)
        .set({
          reportsCount: mine.length,
          resolvedCount: resolved,
          points: 28 + mine.length * 12 + resolved * 45,
        })
        .where(sql`${users.id} = ${insertedUsers[index].id}`);
    }
  });
}
