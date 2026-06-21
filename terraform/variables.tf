# ──────────────────────────────────────────────────────
# Input Variables — set these in terraform.tfvars
# ──────────────────────────────────────────────────────

variable "neon_api_key" {
  description = "Neon API key (from https://console.neon.tech/app/settings/api-keys)"
  type        = string
  sensitive   = true
}

variable "render_api_key" {
  description = "Render API key (from https://dashboard.render.com/u/settings#api-keys)"
  type        = string
  sensitive   = true
}

variable "vercel_api_token" {
  description = "Vercel API token (from https://vercel.com/account/tokens)"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repo in 'owner/repo' format"
  type        = string
  default     = "janiduimesh/ScholarAI"
}

variable "github_branch" {
  description = "Git branch to deploy from"
  type        = string
  default     = "main"
}

variable "gemini_api_key" {
  description = "Google Gemini API key for LLM agents"
  type        = string
  sensitive   = true
  default     = ""
}

variable "secret_key" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-to-a-random-string"
}

variable "neon_region" {
  description = "Neon database region"
  type        = string
  default     = "aws-us-east-1"
}
