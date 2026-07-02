import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// =============================================================================
// This Drizzle schema MIRRORS supabase/migrations/0001_init.sql, which is the canonical
// database definition (it also holds the RLS policies, the signup trigger, and the
// references to Supabase's `auth.users` that Drizzle does not manage). Keep them in sync.
//
// Drizzle is used for typed access from the service-role admin client (src/lib/db/index.ts)
// and as living documentation of the data model. Foreign keys to auth.users are enforced
// in SQL only and are therefore declared here as plain uuid columns.
// =============================================================================

export const plans = pgTable("plans", {
  id: text("id").primaryKey(), // 'free' | 'pro'
  name: text("name").notNull(),
  monthlySearchLimit: integer("monthly_search_limit").notNull(),
  monthlySiteLimit: integer("monthly_site_limit").notNull(),
  monthlyVideoLimit: integer("monthly_video_limit").notNull().default(0),
  priceCents: integer("price_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  planId: text("plan_id")
    .notNull()
    .default("free")
    .references(() => plans.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status")
    .$type<
      "none" | "trialing" | "active" | "past_due" | "canceled" | "incomplete"
    >()
    .notNull()
    .default("none"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  createdBy: uuid("created_by").notNull(), // -> auth.users(id)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // -> auth.users(id)
    role: text("role").$type<"owner" | "admin" | "member">().notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_tenant_user_uniq").on(t.tenantId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users(id)
  email: text("email"),
  fullName: text("full_name"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  currentTenantId: uuid("current_tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const searches = pgTable(
  "searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by"),
    niche: text("niche").notNull(),
    locationLabel: text("location_label"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    radiusM: integer("radius_m").default(5000),
    status: text("status")
      .$type<"pending" | "running" | "complete" | "error">()
      .notNull()
      .default("pending"),
    resultCount: integer("result_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("searches_tenant_idx").on(t.tenantId)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
    source: text("source").notNull().default("google_places"),
    placeId: text("place_id"),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"), // filled on-demand via Place Details (Enterprise field)
    category: text("category"),
    website: text("website"),
    websiteStatus: text("website_status")
      .$type<"no_website" | "has_website" | "unknown">()
      .notNull()
      .default("unknown"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    businessId: text("business_id"), // y-tunnus from PRH/YTJ
    registryStatus: text("registry_status")
      .$type<"matched" | "low_confidence" | "no_match" | "unchecked">()
      .notNull()
      .default("unchecked"),
    registryName: text("registry_name"),
    registryRegistrationDate: date("registry_registration_date"),
    registryIndustryCode: text("registry_industry_code"),
    email: text("email"), // reserved for future enrichment (not populated in v1)
    enrichmentSource: text("enrichment_source"),
    crmStatus: text("crm_status")
      .$type<"new" | "contacted" | "interested" | "converted" | "rejected">()
      .notNull()
      .default("new"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("leads_tenant_place_uniq").on(t.tenantId, t.placeId),
    index("leads_tenant_idx").on(t.tenantId),
  ],
);

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    templateId: text("template_id").notNull().default("generic"),
    title: text("title").notNull(),
    status: text("status")
      .$type<"draft" | "generated" | "published">()
      .notNull()
      .default("draft"),
    content: jsonb("content"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sites_tenant_idx").on(t.tenantId)],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id"),
    kind: text("kind")
      .$type<"lead_search" | "site_generation" | "avatar_video">()
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_tenant_created_idx").on(t.tenantId, t.createdAt)],
);

export const avatarProducts = pgTable(
  "avatar_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by"),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    sellingPoints: jsonb("selling_points").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url"),
    tone: text("tone").notNull().default("casual"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("avatar_products_tenant_idx").on(t.tenantId)],
);

export const videoSeries = pgTable(
  "video_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => avatarProducts.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by"),
    avatarKey: text("avatar_key").notNull(),
    tone: text("tone").notNull().default("casual"),
    count: integer("count").notNull().default(1),
    status: text("status")
      .$type<"draft" | "rendering" | "complete" | "failed">()
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("video_series_tenant_idx").on(t.tenantId),
    index("video_series_product_idx").on(t.productId),
  ],
);

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    seriesId: uuid("series_id")
      .notNull()
      .references(() => videoSeries.id, { onDelete: "cascade" }),
    hookLabel: text("hook_label").notNull().default(""),
    script: text("script").notNull(),
    provider: text("provider").notNull().default("heygen"),
    providerJobId: text("provider_job_id"),
    status: text("status")
      .$type<"draft" | "queued" | "rendering" | "ready" | "failed">()
      .notNull()
      .default("draft"),
    videoUrl: text("video_url"),
    storagePath: text("storage_path"),
    durationSeconds: integer("duration_seconds"),
    costCents: integer("cost_cents"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("videos_tenant_idx").on(t.tenantId),
    index("videos_series_idx").on(t.seriesId),
    index("videos_provider_job_idx").on(t.providerJobId),
  ],
);

export type Plan = typeof plans.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Search = typeof searches.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type AvatarProduct = typeof avatarProducts.$inferSelect;
export type VideoSeries = typeof videoSeries.$inferSelect;
export type Video = typeof videos.$inferSelect;
