export const ADMIN_EMAIL = 'caonguyenthanhan.aaa@gmail.com';

export type FeatureKey =
  | 'confetti'
  | 'celebration'
  | 'weeklyReport'
  | 'weeklyReview'
  | 'backgroundMedia'
  | 'backgroundPublicTemplates'
  | 'chatbot';

export type FeatureConfig = {
  key: FeatureKey;
  label: string;
  requiredPoints: number;
};

export const FEATURE_CONFIG: Record<FeatureKey, FeatureConfig> = {
  confetti: { key: 'confetti', label: 'Pháo giấy khi hoàn thành', requiredPoints: 25 },
  celebration: { key: 'celebration', label: 'Pop-up chúc mừng mục tiêu', requiredPoints: 100 },
  weeklyReport: { key: 'weeklyReport', label: 'Báo cáo tuần', requiredPoints: 50 },
  weeklyReview: { key: 'weeklyReview', label: 'Weekly Review tự động', requiredPoints: 50 },
  backgroundMedia: { key: 'backgroundMedia', label: 'Hình nền ảnh/video', requiredPoints: 75 },
  backgroundPublicTemplates: { key: 'backgroundPublicTemplates', label: 'Mẫu hình nền công khai', requiredPoints: 150 },
  chatbot: { key: 'chatbot', label: 'Trợ lý AI (ChatBot)', requiredPoints: 200 },
};

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isFeatureUnlocked(args: { feature: FeatureKey; points: number; email?: string | null }) {
  const { feature, points, email } = args;
  if (isAdminEmail(email)) return true;
  const cfg = FEATURE_CONFIG[feature];
  return points >= cfg.requiredPoints;
}

export function getRequiredPoints(feature: FeatureKey) {
  return FEATURE_CONFIG[feature].requiredPoints;
}

export function getFeatureLabel(feature: FeatureKey) {
  return FEATURE_CONFIG[feature].label;
}
