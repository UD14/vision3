import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { users, dailyLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { deviceId, actionId, completed } = await req.json();

        if (!deviceId || !actionId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // Update last seen
        await db.update(users).set({ lastSeen: new Date() }).where(eq(users.deviceId, deviceId));

        if (completed) {
            // Check if already logged today for this action
            const existing = await db.select().from(dailyLogs)
                .where(
                    and(
                        eq(dailyLogs.userDeviceId, deviceId),
                        eq(dailyLogs.actionExternalId, actionId),
                        eq(dailyLogs.completedDate, today)
                    )
                )
                .limit(1);

            if (existing.length === 0) {
                await db.insert(dailyLogs).values({
                    userDeviceId: deviceId,
                    actionExternalId: actionId,
                    completedDate: today,
                });
            }
        } else {
            // Remove log if unchecked
            await db.delete(dailyLogs)
                .where(
                    and(
                        eq(dailyLogs.userDeviceId, deviceId),
                        eq(dailyLogs.actionExternalId, actionId),
                        eq(dailyLogs.completedDate, today)
                    )
                );
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Analytics log error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
