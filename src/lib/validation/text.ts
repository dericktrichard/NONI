export function hasHiddenChars(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 32 && code !== 10) return true;
    if (code === 0x7f || code === 0xfeff) return true;
    if (code >= 0x200b && code <= 0x200f) return true;
    if (code >= 0x202a && code <= 0x202e) return true;
    if (code >= 0x2066 && code <= 0x2069) return true;
  }
  return false;
}