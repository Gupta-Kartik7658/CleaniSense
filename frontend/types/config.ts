export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
}

export interface FeatureFlagsResponse {
  ai_validation: boolean;
  push_notifications: boolean;
  rewards: boolean;
}

export interface ConfigResponseData {
  categories: CategoryResponse[];
  supported_languages: string[];
  themes: string[];
  max_upload_size_mb: number;
  allowed_file_types: string[];
  max_attachments: number;
  app_version: string;
  feature_flags: FeatureFlagsResponse;
}
