import { pgTable, serial, text, timestamp, varchar, date, integer, bigint } from "drizzle-orm/pg-core";

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location"),                
  uploader: text("uploader"),         
  category: text("category"),       
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }).notNull(),
  activityDate: date("activity_date").notNull(),
  driveFileId: text("drive_file_id").notNull(),
  fileName: text("file_name"),
  mimeType: varchar("mime_type", { length: 100 }),
  size: bigint("size", { mode: "number" }),
  location: text("location"), 
  uploader: text("uploader"),
  deletedAt: timestamp("deleted_at"),  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});