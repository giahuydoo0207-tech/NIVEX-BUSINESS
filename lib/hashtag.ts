export function normalizeHashtag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase();
}

export function validateHashtag(
  item: string,
  current: string[],
  maxItems = 5,
): string | null {
  if (!item) return "Hashtag không được để trống.";
  if (!/^[a-z0-9_]{2,30}$/.test(item)) {
    return "Hashtag chỉ gồm chữ, số hoặc dấu gạch dưới (2-30 ký tự).";
  }
  if (current.includes(item)) return "Hashtag này đã được thêm.";
  if (current.length >= maxItems) return "Chỉ được thêm tối đa 5 hashtag.";
  return null;
}

export function normalizeSkill(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateSkill(item: string, current: string[]): string | null {
  if (!item) return "Kỹ năng không được để trống.";
  if (current.some((s) => s.toLowerCase() === item.toLowerCase())) {
    return "Kỹ năng này đã được thêm.";
  }
  return null;
}
