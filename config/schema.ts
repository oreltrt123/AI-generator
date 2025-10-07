import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// USERS TABLE (optional for Clerk sync; store emails/userIds here if needed)
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  credits: integer("credits").default(2),
});

// PROJECTS TABLE
export const projectTable = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("projectId").notNull().unique(), // Added unique for safety
  createdBy: varchar("createdBy").notNull(), // No FK—store Clerk email or userId
  createdOn: timestamp("createdOn").defaultNow(),
});

// FRAMES TABLE
export const frameTable = pgTable("frames", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  frameId: varchar("frameId").notNull().unique(), // Unique for quick lookup
  designCode: text("designCode"),
  projectId: varchar("projectId").notNull(), // No FK—reference manually in queries
  createdOn: timestamp("createdOn").defaultNow(),
});

// CHATS TABLE
export const chatTable = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatMessage: jsonb("chatMessage").notNull(), // jsonb for efficient array queries
  frameId: varchar("frameId").notNull(), // Added—links to frames
  createdBy: varchar("createdBy").notNull(), // No FK—store Clerk email or userId
  createdOn: timestamp("createdOn").defaultNow(),
});

// Relations (for Drizzle queries—e.g., db.select().leftJoin(relations))
export const projectRelations = relations(projectTable, ({ many }) => ({
  frames: many(frameTable),
}));

export const frameRelations = relations(frameTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [frameTable.projectId],
    references: [projectTable.projectId],
  }),
  chats: many(chatTable),
}));

export const chatRelations = relations(chatTable, ({ one }) => ({
  frame: one(frameTable, {
    fields: [chatTable.frameId],
    references: [frameTable.frameId],
  }),
}));