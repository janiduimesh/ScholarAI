terraform {
  required_version = ">= 1.5.0"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.0.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = ">= 2.0.0"
    }
  }
}

# ── Provider Authentication ─────────────────────────

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

provider "vercel" {
  api_token = var.vercel_api_token
}
