CREATE TYPE "public"."edge_type_enum" AS ENUM('HALLWAY', 'STAIRCASE', 'ELEVATOR', 'OUTDOOR_PATH');--> statement-breakpoint
CREATE TYPE "public"."node_type_enum" AS ENUM('ROOM', 'POINT_OF_INTEREST', 'ENTRANCE', 'SERVICE_POINT');--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_node_id" integer NOT NULL,
	"to_node_id" integer NOT NULL,
	"weight" double precision,
	"type" "edge_type_enum" NOT NULL,
	"instructions" text,
	"attributes" jsonb
);
--> statement-breakpoint
CREATE TABLE "floor_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer NOT NULL,
	"floor_number" integer,
	"name" text,
	"svg_url" text,
	"width_px" double precision,
	"height_px" double precision,
	"scale_m_per_px" double precision
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"type" "node_type_enum" NOT NULL,
	"floor_plan_id" integer,
	"building_id" integer,
	"coordinates_x_px" double precision,
	"coordinates_y_px" double precision,
	"geom" text,
	"is_accessible" boolean DEFAULT true,
	"qr_code_payload" text,
	"attributes" jsonb,
	CONSTRAINT "nodes_qr_code_payload_unique" UNIQUE("qr_code_payload")
);
--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_from_node_id_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_to_node_id_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_floor_plan_id_floor_plans_id_fk" FOREIGN KEY ("floor_plan_id") REFERENCES "public"."floor_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_edges_from_node_id" ON "edges" USING btree ("from_node_id");--> statement-breakpoint
CREATE INDEX "idx_edges_to_node_id" ON "edges" USING btree ("to_node_id");--> statement-breakpoint
CREATE INDEX "idx_floor_plans_building_id" ON "floor_plans" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_floor_plan_id" ON "nodes" USING btree ("floor_plan_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_building_id" ON "nodes" USING btree ("building_id");