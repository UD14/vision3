/**
 * Analytics functions - fire-and-forget from client side
 * These call API routes that write to Supabase via Drizzle
 */

// Get or create anonymous device ID
export function getDeviceId(): string {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("vision3_device_id");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("vision3_device_id", id);
    }
    return id;
}

// Sync goal + KPIs + actions to DB (fire-and-forget)
export function syncGoalToAnalytics(goal: {
    id: string;
    title: string;
    currentStatus: string;
    duration: string;
    kpis: { id: string; title: string; actions: { id: string; title: string; score: number }[] }[];
}) {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    fetch("/api/analytics/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, goal }),
    }).catch(() => {
        // Silently fail - analytics should never block the app
    });
}

// Log action completion (fire-and-forget)
export function logActionToAnalytics(actionId: string, completed: boolean) {
    const deviceId = getDeviceId();
    if (!deviceId) return;

    fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, actionId, completed }),
    }).catch(() => {
        // Silently fail
    });
}
