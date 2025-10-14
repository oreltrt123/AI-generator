import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// USERS TABLE (optional for Clerk sync; store emails/userIds here if needed)
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  credits: integer("credits").default(2),
})

// PROJECTS TABLE
export const projectTable = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("projectId").notNull().unique(), // Added unique for safety
  createdBy: varchar("createdBy").notNull(), // No FK—store Clerk email or userId
  createdOn: timestamp("createdOn").defaultNow(),
})

// FRAMES TABLE
export const frameTable = pgTable("frames", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  frameId: varchar("frameId").notNull().unique(), // Unique for quick lookup
  designCode: text("designCode"),
  projectId: varchar("projectId").notNull(), // No FK—reference manually in queries
  createdOn: timestamp("createdOn").defaultNow(),
})

// CHATS TABLE
export const chatTable = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatMessage: jsonb("chatMessage").notNull(), // jsonb for efficient array queries
  frameId: varchar("frameId").notNull(), // Added—links to frames
  createdBy: varchar("createdBy").notNull(), // No FK—store Clerk email or userId
  createdOn: timestamp("createdOn").defaultNow(),
})

// DEPLOYMENTS TABLE
export const deploymentsTable = pgTable("deployments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subdomain: varchar("subdomain", { length: 255 }).notNull().unique(),
  htmlContent: text("htmlContent").notNull(),
  deployedBy: varchar("deployedBy").notNull(), // Store Clerk email or userId
  projectId: varchar("projectId"), // Optional link to project
  deployedOn: timestamp("deployedOn").defaultNow(),
})

// VERCEL DEPLOYMENTS TABLE
export const vercelDeploymentsTable = pgTable("vercel_deployments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("projectId").notNull(),
  deploymentUrl: varchar("deploymentUrl", { length: 500 }).notNull(),
  vercelDeploymentId: varchar("vercelDeploymentId", { length: 255 }),
  deployedBy: varchar("deployedBy").notNull(),
  deployedOn: timestamp("deployedOn").defaultNow(),
})

// DATABASE CONNECTIONS TABLE
export const databaseConnectionsTable = pgTable("database_connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId").notNull(), // Clerk user ID
  provider: varchar("provider", { length: 50 }).notNull(), // "supabase" or "firebase"
  connectionName: varchar("connectionName", { length: 255 }).notNull(),
  config: jsonb("config").notNull(), // Store Supabase token or Firebase config
  projectId: varchar("projectId"), // Optional: link to specific project
  isActive: integer("isActive").default(1), // 1 = active, 0 = inactive
  createdOn: timestamp("createdOn").defaultNow(),
  updatedOn: timestamp("updatedOn").defaultNow(),
})

// Relations (for Drizzle queries—e.g., db.select().leftJoin(relations))
export const projectRelations = relations(projectTable, ({ many }) => ({
  frames: many(frameTable),
}))

export const frameRelations = relations(frameTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [frameTable.projectId],
    references: [projectTable.projectId],
  }),
  chats: many(chatTable),
}))

export const chatRelations = relations(chatTable, ({ one }) => ({
  frame: one(frameTable, {
    fields: [chatTable.frameId],
    references: [frameTable.frameId],
  }),
}))

export const deploymentRelations = relations(deploymentsTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [deploymentsTable.projectId],
    references: [projectTable.projectId],
  }),
}))

export const vercelDeploymentRelations = relations(vercelDeploymentsTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [vercelDeploymentsTable.projectId],
    references: [projectTable.projectId],
  }),
}))

export const databaseConnectionRelations = relations(databaseConnectionsTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [databaseConnectionsTable.projectId],
    references: [projectTable.projectId],
  }),
}))
