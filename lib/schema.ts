import { pgTable, serial, text, timestamp, varchar, date } from "drizzle-orm/pg-core";

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  activityDate: date("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  activityId: serial("activity_id").references(() => activities.id),
  driveFileId: text("drive_file_id").notNull(),
  fileName: text("file_name"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});