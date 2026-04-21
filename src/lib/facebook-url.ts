// Helper normalize & validate Facebook group URL

const FB_GROUP_PATTERN = /^https?:\/\/(www\.)?facebook\.com\/groups\/[^/?#]+/i;

/**
 * Validate xem URL có phải là Facebook group URL hợp lệ không.
 */
export function isFacebookGroupUrl(url: string): boolean {
  return FB_GROUP_PATTERN.test(url.trim());
}

/**
 * Normalize URL:
 * - Strip query params và trailing slash
 * - Đổi www.facebook.com → facebook.com
 */
export function normalizeFacebookGroupUrl(url: string): string {
  let u = url.trim();
  // Ensure https
  if (u.startsWith("http://")) u = "https://" + u.slice(7);
  try {
    const parsed = new URL(u);
    // Chuẩn hoá hostname
    parsed.hostname = parsed.hostname.replace(/^www\./, "facebook.");
    if (!parsed.hostname.startsWith("facebook.")) {
      parsed.hostname = "facebook.com";
    }
    // Giữ chỉ pathname (không query, không hash)
    const normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    // Strip trailing slash
    return normalized.replace(/\/+$/, "");
  } catch {
    return u.replace(/\/+$/, "");
  }
}
