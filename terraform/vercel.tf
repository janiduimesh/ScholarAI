# ──────────────────────────────────────────────────────
# Vercel — React/Vite Frontend
# ──────────────────────────────────────────────────────

resource "vercel_project" "frontend" {
  name      = "scholarai"
  framework = "vite"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  root_directory = "frontend"
  build_command  = "npm run build"
  output_directory = "dist"

  environment = [
    {
      key    = "VITE_API_BASE"
      value  = "https://${render_web_service.backend.name}.onrender.com/api/v1"
      target = ["production", "preview"]
    }
  ]
}

resource "vercel_deployment" "initial" {
  project_id = vercel_project.frontend.id
  ref        = var.github_branch
}
