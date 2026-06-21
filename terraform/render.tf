resource "render_web_service" "backend" {
  name        = "scholarai-backend"
  plan        = "free"
  region      = "oregon"

  runtime_source = {
    docker = {
      repo_url        = "https://github.com/${var.github_repo}"
      branch          = var.github_branch
      root_dir        = "backend"
      docker_context  = "."
      dockerfile_path = "Dockerfile"
    }
  }

  env_vars = {
    "DATABASE_URL"               = { value = var.database_url }
    "SECRET_KEY"                 = { value = var.secret_key }
    "ALGORITHM"                  = { value = "HS256" }
    "ACCESS_TOKEN_EXPIRE_MINUTES" = { value = "120" }
    "LLM_PROVIDER"               = { value = "gemini" }
    "GEMINI_API_KEY"              = { value = var.gemini_api_key }
  }
}
