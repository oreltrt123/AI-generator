import { integer, jsonb, pgTable, text, timestamp, varchar, real, boolean } from "drizzle-orm/pg-core"
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
  projectId: varchar("projectId").notNull().unique(),
  projectName: varchar("projectName", { length: 500 }).notNull().default("Untitled Project"),
  createdBy: varchar("createdBy").notNull(),
  createdOn: timestamp("createdOn").defaultNow(),
  updatedOn: timestamp("updatedOn").defaultNow(),
})

export const projectCollaboratorsTable = pgTable("project_collaborators", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("projectId").notNull(),
  userEmail: varchar("userEmail", { length: 255 }).notNull(),
  invitedBy: varchar("invitedBy").notNull(),
  role: varchar("role", { length: 50 }).default("viewer"), // viewer, editor, admin
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, rejected
  invitedOn: timestamp("invitedOn").defaultNow(),
  acceptedOn: timestamp("acceptedOn"),
})

// FRAMES TABLE
export const frameTable = pgTable("frames", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  frameId: varchar("frameId").notNull().unique(),
  designCode: text("designCode"),
  projectId: varchar("projectId").notNull(),
  createdOn: timestamp("createdOn").defaultNow(),
})

export const variantsTable = pgTable("variants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  frameId: varchar("frameId").notNull(),
  variantNumber: integer("variantNumber").notNull(), // 1, 2, 3, or 4
  projectFiles: jsonb("projectFiles").notNull(), // Array of {path, content}
  prdData: jsonb("prdData"), // PRD data for this variant
  imageUrls: jsonb("imageUrls"), // Array of image URLs
  createdOn: timestamp("createdOn").defaultNow(),
})

// CHATS TABLE
export const chatTable = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatMessage: jsonb("chatMessage").notNull(),
  frameId: varchar("frameId"),
  createdBy: varchar("createdBy").notNull(),
  createdOn: timestamp("createdOn").defaultNow(),
  messageId: varchar("messageId"),
  codeSnapshot: text("codeSnapshot"),
  reasoning: text("reasoning"),
  filesGenerated: jsonb("filesGenerated"),
  thinkingTime: integer("thinkingTime"),
})

// DEPLOYMENTS TABLE
export const deploymentsTable = pgTable("deployments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subdomain: varchar("subdomain", { length: 255 }).notNull().unique(),
  htmlContent: text("htmlContent").notNull(),
  deployedBy: varchar("deployedBy").notNull(),
  projectId: varchar("projectId"),
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
  userId: varchar("userId").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  connectionName: varchar("connectionName", { length: 255 }).notNull(),
  config: jsonb("config").notNull(),
  projectId: varchar("projectId"),
  isActive: integer("isActive").default(1),
  createdOn: timestamp("createdOn").defaultNow(),
  updatedOn: timestamp("updatedOn").defaultNow(),
})

// ADAPTIVE DEPLOYMENTS TABLE - Stores deployed sites with versioning
export const adaptiveDeploymentsTable = pgTable("adaptive_deployments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("projectId").notNull(),
  deploymentId: varchar("deploymentId").notNull().unique(),
  projectFiles: jsonb("projectFiles").notNull(),
  currentVersion: integer("currentVersion").default(1),
  language: varchar("language", { length: 50 }).notNull(),
  deployedBy: varchar("deployedBy").notNull(),
  isActive: boolean("isActive").default(true),
  deployedOn: timestamp("deployedOn").defaultNow(),
  lastUpdated: timestamp("lastUpdated").defaultNow(),
})

// SITE ANALYTICS TABLE - Tracks user behavior on deployed sites
export const siteAnalyticsTable = pgTable("site_analytics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deploymentId: varchar("deploymentId").notNull(),
  sessionId: varchar("sessionId").notNull(),
  eventType: varchar("eventType", { length: 50 }).notNull(),
  elementSelector: varchar("elementSelector", { length: 500 }),
  elementText: text("elementText"),
  scrollDepth: integer("scrollDepth"),
  timeSpent: integer("timeSpent"),
  sectionId: varchar("sectionId", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
})

// SITE VERSIONS TABLE - Stores historical versions of site configs
export const siteVersionsTable = pgTable("site_versions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deploymentId: varchar("deploymentId").notNull(),
  versionNumber: integer("versionNumber").notNull(),
  projectFiles: jsonb("projectFiles").notNull(),
  siteConfig: jsonb("siteConfig").notNull(),
  changesSummary: text("changesSummary"),
  performanceMetrics: jsonb("performanceMetrics"),
  createdBy: varchar("createdBy").default("adaptive-ai"),
  createdOn: timestamp("createdOn").defaultNow(),
})

// ADAPTIVE CONFIGS TABLE - Stores AI-generated site modifications
export const adaptiveConfigsTable = pgTable("adaptive_configs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deploymentId: varchar("deploymentId").notNull(),
  configType: varchar("configType", { length: 50 }).notNull(),
  targetElement: varchar("targetElement", { length: 500 }),
  originalValue: text("originalValue"),
  newValue: text("newValue"),
  reasoning: text("reasoning"),
  appliedOn: timestamp("appliedOn").defaultNow(),
  isActive: boolean("isActive").default(true),
  performanceImpact: real("performanceImpact"),
})

// ENGAGEMENT METRICS TABLE - Aggregated analytics for AI decision-making
export const engagementMetricsTable = pgTable("engagement_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deploymentId: varchar("deploymentId").notNull(),
  versionNumber: integer("versionNumber").notNull(),
  totalVisitors: integer("totalVisitors").default(0),
  avgTimeSpent: real("avgTimeSpent").default(0),
  avgScrollDepth: real("avgScrollDepth").default(0),
  ctaClickRate: real("ctaClickRate").default(0),
  bounceRate: real("bounceRate").default(0),
  topClickedElements: jsonb("topClickedElements"),
  lowEngagementSections: jsonb("lowEngagementSections"),
  calculatedOn: timestamp("calculatedOn").defaultNow(),
})

// Relations
export const projectRelations = relations(projectTable, ({ many }) => ({
  frames: many(frameTable),
  collaborators: many(projectCollaboratorsTable),
}))

export const collaboratorRelations = relations(projectCollaboratorsTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [projectCollaboratorsTable.projectId],
    references: [projectTable.projectId],
  }),
}))

export const frameRelations = relations(frameTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [frameTable.projectId],
    references: [projectTable.projectId],
  }),
  chats: many(chatTable),
  variants: many(variantsTable),
}))

export const variantRelations = relations(variantsTable, ({ one }) => ({
  frame: one(frameTable, {
    fields: [variantsTable.frameId],
    references: [frameTable.frameId],
  }),
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

export const adaptiveDeploymentRelations = relations(adaptiveDeploymentsTable, ({ many }) => ({
  analytics: many(siteAnalyticsTable),
  versions: many(siteVersionsTable),
  configs: many(adaptiveConfigsTable),
  metrics: many(engagementMetricsTable),
}))

export const siteAnalyticsRelations = relations(siteAnalyticsTable, ({ one }) => ({
  deployment: one(adaptiveDeploymentsTable, {
    fields: [siteAnalyticsTable.deploymentId],
    references: [adaptiveDeploymentsTable.deploymentId],
  }),
}))

export const siteVersionsRelations = relations(siteVersionsTable, ({ one }) => ({
  deployment: one(adaptiveDeploymentsTable, {
    fields: [siteVersionsTable.deploymentId],
    references: [adaptiveDeploymentsTable.deploymentId],
  }),
}))

export const adaptiveConfigsRelations = relations(adaptiveConfigsTable, ({ one }) => ({
  deployment: one(adaptiveDeploymentsTable, {
    fields: [adaptiveConfigsTable.deploymentId],
    references: [adaptiveDeploymentsTable.deploymentId],
  }),
}))

export const engagementMetricsRelations = relations(engagementMetricsTable, ({ one }) => ({
  deployment: one(adaptiveDeploymentsTable, {
    fields: [engagementMetricsTable.deploymentId],
    references: [adaptiveDeploymentsTable.deploymentId],
  }),
}))
