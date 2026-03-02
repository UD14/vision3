import { pgTable, uuid, text, timestamp, integer, boolean, date, serial } from "drizzle-orm/pg-core";

// ── Users ──
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    deviceId: uuid("device_id").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

// ── Goals ──
export const goals = pgTable("goals", {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull(), // client-side generated ID
    userDeviceId: uuid("user_device_id").notNull(),
    title: text("title").notNull(),
    currentStatus: text("current_status"),
    duration: text("duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── KPIs ──
export const kpis = pgTable("kpis", {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull(),
    goalId: integer("goal_id").references(() => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    displayOrder: integer("display_order").default(0),
});

// ── Actions ──
export const actions = pgTable("actions", {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull(),
    kpiId: integer("kpi_id").references(() => kpis.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    score: integer("score").default(3),
    isUserAdded: boolean("is_user_added").default(false),
});

// ── Daily Logs ──
export const dailyLogs = pgTable("daily_logs", {
    id: serial("id").primaryKey(),
    userDeviceId: uuid("user_device_id").notNull(),
    actionExternalId: text("action_external_id").notNull(),
    completedDate: date("completed_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
