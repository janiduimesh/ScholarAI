output "database_url" {
  description = "Neon PostgreSQL connection string (sensitive)"
  value       = var.database_url
  sensitive   = true
}

output "backend_url" {
  description = "Render backend API base URL"
  value       = render_web_service.backend.url
}

output "frontend_url" {
  description = "Vercel frontend URL"
  value       = "https://${vercel_project.frontend.name}.vercel.app"
}

output "api_docs_url" {
  description = "FastAPI Swagger documentation"
  value       = "${render_web_service.backend.url}/docs"
}
