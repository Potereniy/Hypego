export function isAllowedGifUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' &&
      ['media.tenor.com', 'tenor.com', 'media.giphy.com', 'giphy.com']
        .includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function encodeGif(url: string): string {
  return `[[gif:${url.trim()}]]`;
}
