import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { reportUpdates, reports, reportVotes, users } from "@/db/schema";
import { analyzeProblem, type AnalyzeInput, type ExistingReport } from "@/lib/ai";
import {
  CATEGORIES,
  NEIGHBOURHOODS,
  type CategoryId,
  type LeaderRecord,
  type PlatformStats,
  type Priority,
  type ReportRecord,
  type ReportStatus,
  type ReportUpdateRecord,
} from "@/lib/types";

type ReportRow = typeof reports.$inferSelect;
type UserRow = typeof users.$inferSelect;

function mapReport(report: ReportRow, user: UserRow | null): ReportRecord {
  return {
    id: report.id,
    reference: report.reference,
    reporterId: report.reporterId,
    reporterName: user?.name ?? null,
    reporterHandle: user?.handle ?? null,
    reporterTone: user?.tone ?? null,
    title: report.title,
    description: report.description,
    language: report.language,
    category: report.category,
    aiCategory: report.aiCategory,
    aiConfidence: report.aiConfidence,
    priority: report.priority,
    priorityScore: report.priorityScore,
    priorityReason: report.priorityReason,
    status: report.status,
    neighbourhood: report.neighbourhood,
    address: report.address,
    lat: report.lat,
    lng: report.lng,
    imageUrl: report.imageUrl,
    aiSummary: report.aiSummary,
    tags: report.tags ?? [],
    recommendations: report.recommendations ?? [],
    signals: report.signals ?? null,
    responsibleDepartment: report.responsibleDepartment,
    expectedResponse: report.expectedResponse,
    duplicateOfId: report.duplicateOfId,
    duplicateCount: report.duplicateCount,
    upvotes: report.upvotes,
    verifications: report.verifications,
    categoryCorrected: report.categoryCorrected,
    modelVersion: report.modelVersion,
    impactPoints: report.impactPoints,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    resolvedAt: report.resolvedAt ? report.resolvedAt.toISOString() : null,
  };
}

export async function getAllReports(): Promise<ReportRecord[]> {
  const rows = await db
    .select({ report: reports, user: users })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));
  return rows.map((row) => mapReport(row.report, row.user));
}

export async function getReportsForDuplicates(): Promise<ExistingReport[]> {
  const rows = await db
    .select({
      id: reports.id,
      reference: reports.reference,
      title: reports.title,
      description: reports.description,
      category: reports.category,
      status: reports.status,
      neighbourhood: reports.neighbourhood,
      lat: reports.lat,
      lng: reports.lng,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(120);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function getLeaderboard(): Promise<LeaderRecord[]> {
  const rows = await db.select().from(users).orderBy(desc(users.points));
  return rows.map((user) => ({
    id: user.id,
    name: user.name,
    handle: user.handle,
    neighbourhood: user.neighbourhood,
    role: user.role,
    points: user.points,
    reportsCount: user.reportsCount,
    resolvedCount: user.resolvedCount,
    tone: user.tone,
  }));
}

export async function getPlatformStats(
  allReports: ReportRecord[],
  leaders: LeaderRecord[],
): Promise<PlatformStats> {
  const resolved = allReports.filter((r) => r.status === "resolved");
  const open = allReports.filter((r) => r.status === "open");
  const inProgress = allReports.filter((r) => r.status === "in_progress");
  const duplicateChildren = allReports.filter((r) => r.duplicateOfId != null);
  const resolutionHours = resolved
    .filter((r) => r.resolvedAt)
    .map(
      (r) =>
        (new Date(r.resolvedAt as string).getTime() - new Date(r.createdAt).getTime()) /
        3_600_000,
    );
  const avgResolutionHours = resolutionHours.length
    ? Math.round(resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length)
    : 0;

  const byCategory = CATEGORIES.map((category) => {
    const matches = allReports.filter((r) => r.category === category.id);
    return {
      category: category.id,
      count: matches.length,
      resolved: matches.filter((r) => r.status === "resolved").length,
    };
  });

  const byNeighbourhood = NEIGHBOURHOODS.map((hood) => {
    const matches = allReports.filter(
      (r) => r.neighbourhood.toLowerCase() === hood.name.toLowerCase(),
    );
    const categories: Record<string, number> = {};
    matches.forEach((report) => {
      categories[report.category] = (categories[report.category] ?? 0) + 1;
    });
    return {
      id: hood.id,
      name: hood.name,
      x: hood.x,
      y: hood.y,
      open: matches.filter((r) => r.status !== "resolved").length,
      resolved: matches.filter((r) => r.status === "resolved").length,
      total: matches.length,
      highPriority: matches.filter((r) => r.priority === "high" && r.status !== "resolved")
        .length,
      categories,
    };
  });

  const trend: PlatformStats["trend"] = [];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - dayOffset);
    const end = new Date(start.getTime() + 24 * 3_600_000);
    trend.push({
      date: start.toISOString().slice(0, 10),
      reported: allReports.filter((r) => {
        const created = new Date(r.createdAt).getTime();
        return created >= start.getTime() && created < end.getTime();
      }).length,
      resolved: allReports.filter((r) => {
        if (!r.resolvedAt) return false;
        const closed = new Date(r.resolvedAt).getTime();
        return closed >= start.getTime() && closed < end.getTime();
      }).length,
    });
  }

  return {
    totalReports: allReports.length,
    resolved: resolved.length,
    inProgress: inProgress.length,
    open: open.length,
    highPriority: allReports.filter((r) => r.priority === "high" && r.status !== "resolved").length,
    duplicatesGrouped: duplicateChildren.length,
    neighbours: leaders.length,
    avgResolutionHours,
    impactPoints: leaders.reduce((sum, leader) => sum + leader.points, 0),
    resolutionRate: allReports.length
      ? Math.round((resolved.length / allReports.length) * 100)
      : 0,
    byCategory,
    byNeighbourhood,
    trend,
  };
}

export async function getReportDetail(id: number): Promise<{
  report: ReportRecord;
  updates: ReportUpdateRecord[];
  related: ReportRecord[];
} | null> {
  const [row] = await db
    .select({ report: reports, user: users })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .where(eq(reports.id, id))
    .limit(1);
  if (!row) return null;

  const updateRows = await db
    .select({ update: reportUpdates, user: users })
    .from(reportUpdates)
    .leftJoin(users, eq(reportUpdates.userId, users.id))
    .where(eq(reportUpdates.reportId, id))
    .orderBy(desc(reportUpdates.createdAt));

  const canonicalId = row.report.duplicateOfId ?? row.report.id;
  const relatedRows = await db
    .select({ report: reports, user: users })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .where(or(eq(reports.duplicateOfId, canonicalId), eq(reports.id, canonicalId)))
    .orderBy(desc(reports.createdAt));

  return {
    report: mapReport(row.report, row.user),
    updates: updateRows.map((item) => ({
      id: item.update.id,
      reportId: item.update.reportId,
      kind: item.update.kind,
      fromStatus: item.update.fromStatus,
      toStatus: item.update.toStatus,
      note: item.update.note,
      actorName: item.user?.name ?? "LifeLoop AI",
      createdAt: item.update.createdAt.toISOString(),
    })),
    related: relatedRows
      .filter((item) => item.report.id !== id)
      .map((item) => mapReport(item.report, item.user)),
  };
}

export type CreateReportInput = AnalyzeInput & {
  reporterId: number;
  imageUrl?: string | null;
  categoryOverride?: CategoryId | null;
  priorityOverride?: Priority | null;
  duplicateOfId?: number | null;
};

export async function createReport(input: CreateReportInput): Promise<{
  id: number;
  reference: string;
  analysis: ReturnType<typeof analyzeProblem>;
}> {
  const existing = await getReportsForDuplicates();
  const analysis = analyzeProblem(input, existing);
  const category = input.categoryOverride ?? analysis.category;
  const priority = input.priorityOverride ?? analysis.priority;
  const canonical =
    input.duplicateOfId ??
    (analysis.duplicateVerdict === "likely_duplicate" && analysis.duplicates[0]
      ? analysis.duplicates[0].id
      : null);

  const neighbourhood = input.neighbourhood ?? "Old Town";
  const hood =
    NEIGHBOURHOODS.find((item) => item.name.toLowerCase() === neighbourhood.toLowerCase()) ??
    NEIGHBOURHOODS[0];

  const [inserted] = await db
    .insert(reports)
    .values({
      reference: `LL-${Date.now().toString().slice(-7)}`,
      reporterId: input.reporterId,
      title: input.title.trim().slice(0, 140),
      description: input.description.trim().slice(0, 2000),
      language: analysis.signals.language,
      category,
      aiCategory: analysis.category,
      aiConfidence: analysis.confidence / 100,
      priority,
      priorityScore: analysis.priorityScore,
      priorityReason: analysis.priorityReason,
      status: "open",
      neighbourhood,
      address: input.address?.trim().slice(0, 160) || hood.name,
      lat: input.lat ?? hood.lat,
      lng: input.lng ?? hood.lng,
      imageUrl: input.imageUrl ?? null,
      aiSummary: analysis.summary,
      tags: analysis.tags,
      recommendations: analysis.recommendations,
      signals: analysis.signals,
      duplicateCandidates: analysis.duplicates,
      responsibleDepartment: analysis.responsibleDepartment,
      expectedResponse: analysis.expectedResponse,
      duplicateOfId: canonical,
      duplicateCount: 0,
      upvotes: 0,
      verifications: 0,
      categoryCorrected: category !== analysis.category,
      modelVersion: analysis.modelVersion,
      impactPoints: 10,
    })
    .returning({ id: reports.id });

  const reference = `LL-${1024 + inserted.id}`;
  await db.update(reports).set({ reference }).where(eq(reports.id, inserted.id));

  await db.insert(reportUpdates).values({
    reportId: inserted.id,
    userId: input.reporterId,
    kind: "ai",
    toStatus: "open",
    note: `Report received. AI predicted ${analysis.categoryLabel} at ${analysis.confidence}% confidence with ${priority} priority.`,
  });

  if (canonical) {
    await db
      .update(reports)
      .set({ duplicateCount: sql`${reports.duplicateCount} + 1` })
      .where(eq(reports.id, canonical));
    await db.insert(reportUpdates).values({
      reportId: canonical,
      userId: input.reporterId,
      kind: "duplicate",
      note: "Duplicate intelligence linked a new report to this thread. The group now shares one action trail.",
    });
  }

  await db
    .update(users)
    .set({
      points: sql`${users.points} + ${10}`,
      reportsCount: sql`${users.reportsCount} + 1`,
    })
    .where(eq(users.id, input.reporterId));

  return { id: inserted.id, reference, analysis };
}

export async function recordVote(
  reportId: number,
  userId: number,
  kind: "upvote" | "verify",
): Promise<{ ok: boolean; message: string }> {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return { ok: false, message: "Report not found" };

  const inserted = await db
    .insert(reportVotes)
    .values({ reportId, userId, kind })
    .onConflictDoNothing()
    .returning({ id: reportVotes.id });

  if (!inserted.length) {
    return { ok: false, message: "You already added your voice to this report." };
  }

  await db
    .update(reports)
    .set(
      kind === "verify"
        ? { verifications: sql`${reports.verifications} + 1` }
        : { upvotes: sql`${reports.upvotes} + 1` },
    )
    .where(eq(reports.id, reportId));

  if (report.reporterId) {
    await db
      .update(users)
      .set({ points: sql`${users.points} + 2` })
      .where(eq(users.id, report.reporterId));
  }
  await db
    .update(users)
    .set({ points: sql`${users.points} + 4` })
    .where(eq(users.id, userId));

  return {
    ok: true,
    message: kind === "verify" ? "Community verification added." : "Your support was recorded.",
  };
}

export async function changeStatus(
  reportId: number,
  userId: number,
  toStatus: ReportStatus,
  note?: string,
): Promise<{ ok: boolean; message: string }> {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return { ok: false, message: "Report not found" };
  if (report.status === toStatus) {
    return { ok: false, message: "This report already has that status." };
  }

  const resolvedAt = toStatus === "resolved" ? new Date() : null;
  await db
    .update(reports)
    .set({ status: toStatus, resolvedAt, updatedAt: new Date() })
    .where(eq(reports.id, reportId));

  const statusLabel =
    toStatus === "resolved" ? "Resolved" : toStatus === "in_progress" ? "In progress" : "Open";
  await db.insert(reportUpdates).values({
    reportId,
    userId,
    kind: "status",
    fromStatus: report.status,
    toStatus,
    note:
      note?.trim() ||
      (toStatus === "resolved"
        ? "Work completed on site and confirmed by a community verifier."
        : `Moved to ${statusLabel.toLowerCase()} by the community desk.`),
  });

  await db
    .update(users)
    .set({ points: sql`${users.points} + 6` })
    .where(eq(users.id, userId));

  if (toStatus === "resolved" && report.reporterId) {
    await db
      .update(users)
      .set({
        points: sql`${users.points} + 25`,
        resolvedCount: sql`${users.resolvedCount} + 1`,
      })
      .where(eq(users.id, report.reporterId));
    await db
      .update(reports)
      .set({ impactPoints: sql`${reports.impactPoints} + 25` })
      .where(eq(reports.id, reportId));
  }

  return { ok: true, message: `Report moved to ${statusLabel.toLowerCase()}.` };
}

export async function correctCategory(
  reportId: number,
  userId: number,
  category: CategoryId,
): Promise<{ ok: boolean; message: string }> {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return { ok: false, message: "Report not found" };

  await db
    .update(reports)
    .set({
      category,
      categoryCorrected: category !== report.aiCategory,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId));

  await db.insert(reportUpdates).values({
    reportId,
    userId,
    kind: "correction",
    note: `Human review corrected the category from ${report.category} to ${category}. AI predictions are suggestions, not verified facts.`,
  });

  await db
    .update(users)
    .set({ points: sql`${users.points} + 5` })
    .where(eq(users.id, userId));

  return { ok: true, message: "Category corrected. The AI suggestion was kept for audit." };
}

export async function addNote(
  reportId: number,
  userId: number,
  note: string,
): Promise<{ ok: boolean; message: string }> {
  if (!note.trim()) return { ok: false, message: "Add a short note first." };
  await db.insert(reportUpdates).values({
    reportId,
    userId,
    kind: "note",
    note: note.trim().slice(0, 600),
  });
  await db
    .update(reports)
    .set({ updatedAt: new Date() })
    .where(eq(reports.id, reportId));
  await db
    .update(users)
    .set({ points: sql`${users.points} + 3` })
    .where(eq(users.id, userId));
  return { ok: true, message: "Update added to the action trail." };
}

export async function getNeighbourhoodCategoryFeed(): Promise<
  { neighbourhood: string; category: CategoryId; count: number }[]
> {
  const rows = await db
    .select({
      neighbourhood: reports.neighbourhood,
      category: reports.category,
      count: sql<number>`count(*)::int`,
    })
    .from(reports)
    .where(and(sql`${reports.status} <> 'resolved'`))
    .groupBy(reports.neighbourhood, reports.category);
  return rows;
}
