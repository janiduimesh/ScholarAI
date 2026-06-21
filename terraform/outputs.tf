# ──────────────────────────────────────────────────────
# Outputs — Printed after `terraform apply`
# ──────────────────────────────────────────────────────

output "database_url" {
  description = "Neon PostgreSQL connection string (sensitive)"
  value       = local.db_url
  sensitive   = true
}

output "backend_url" {
  description = "Render backend API base URL"
  value       = "https://${render_web_service.backend.name}.onrender.com"
}

output "frontend_url" {
  description = "Vercel frontend URL"
  value       = "https://${vercel_project.frontend.name}.vercel.app"
}

output "api_docs_url" {
  description = "FastAPI Swagger documentation"
  value       = "https://${render_web_service.backend.name}.onrender.com/docs"
}
