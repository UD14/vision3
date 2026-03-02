import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { users, goals, kpis, actions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { deviceId, goal } = await req.json();

        if (!deviceId || !goal) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Upsert user
        const existingUser = await db.select().from(users).where(eq(users.deviceId, deviceId)).limit(1);
        if (existingUser.length === 0) {
            await db.insert(users).values({ deviceId });
        } else {
            await db.update(users).set({ lastSeen: new Date() }).where(eq(users.deviceId, deviceId));
        }

        // Check if goal already exists (by external ID)
        const existingGoal = await db.select().from(goals).where(eq(goals.externalId, goal.id)).limit(1);

        let goalDbId: number;

        if (existingGoal.length > 0) {
            goalDbId = existingGoal[0].id;
            // Update goal
            await db.update(goals).set({
                title: goal.title,
                currentStatus: goal.currentStatus,
                duration: goal.duration,
            }).where(eq(goals.id, goalDbId));

            // Delete old KPIs (cascade will delete actions too)
            await db.delete(kpis).where(eq(kpis.goalId, goalDbId));
        } else {
            // Insert new goal
            const [newGoal] = await db.insert(goals).values({
                externalId: goal.id,
                userDeviceId: deviceId,
                title: goal.title,
                currentStatus: goal.currentStatus,
                duration: goal.duration,
            }).returning({ id: goals.id });
            goalDbId = newGoal.id;
        }

        // Insert KPIs and their actions
        for (let i = 0; i < goal.kpis.length; i++) {
            const kpi = goal.kpis[i];
            const [newKpi] = await db.insert(kpis).values({
                externalId: kpi.id,
                goalId: goalDbId,
                title: kpi.title,
                displayOrder: i,
            }).returning({ id: kpis.id });

            if (kpi.actions && kpi.actions.length > 0) {
                await db.insert(actions).values(
                    kpi.actions.map((action: any) => ({
                        externalId: action.id,
                        kpiId: newKpi.id,
                        title: action.title,
                        score: action.score || 3,
                        isUserAdded: false,
                    }))
                );
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Analytics sync error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
