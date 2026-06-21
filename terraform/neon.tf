# ──────────────────────────────────────────────────────
# Neon PostgreSQL Database
# ──────────────────────────────────────────────────────

resource "neon_project" "scholarai" {
  name      = "scholarai-db"
  region_id = var.neon_region

  default_endpoint_settings {
    autoscaling_limit_min_cu = 0.25
    autoscaling_limit_max_cu = 0.25
    suspend_timeout_seconds  = 300 # Auto-suspend after 5 min idle (saves free-tier compute)
  }
}

resource "neon_database" "main" {
  project_id = neon_project.scholarai.id
  branch_id  = neon_project.scholarai.default_branch_id
  name       = "scholarai"
  owner_name = neon_role.app.name
}

resource "neon_role" "app" {
  project_id = neon_project.scholarai.id
  branch_id  = neon_project.scholarai.default_branch_id
  name       = "scholarai_app"
}

# ── Construct the connection string for the backend ──

locals {
  db_host = neon_project.scholarai.database_host
  db_url  = "postgresql+psycopg2://${neon_role.app.name}:${neon_role.app.password}@${local.db_host}/${neon_database.main.name}?sslmode=require"
}
