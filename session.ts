import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { LeaderRecord } from "@/lib/types";

const COOKIE = "lifeloop_user";

export async function getCurrentUser(): Promise<LeaderRecord> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;

  if (Number.isFinite(id)) {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (row) return toLeader(row);
  }

  const [fallback] = await db.select().from(users).orderBy(users.id).limit(1);
  if (!fallback) {
    return {
      id: 1,
      name: "Guest neighbour",
      handle: "guest",
      neighbourhood: "Old Town",
      role: "Resident",
      points: 0,
      reportsCount: 0,
      resolvedCount: 0,
      tone: "emerald",
    };
  }
  return toLeader(fallback);
}

function toLeader(row: typeof users.$inferSelect): LeaderRecord {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    neighbourhood: row.neighbourhood,
    role: row.role,
    points: row.points,
    reportsCount: row.reportsCount,
    resolvedCount: row.resolvedCount,
    tone: row.tone,
  };
}

export const SESSION_COOKIE = COOKIE;
