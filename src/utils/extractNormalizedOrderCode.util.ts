export function extractNormalizedOrderCode(content: string): string | null {
    if (!content) return null;

    const upper = content.toUpperCase();
    const matched = upper.match(/OD[-_\s]*\d{6}[-_\s]*[A-Z0-9]{6,}/);
    if (!matched) {
        return null;
    }
    const normalized = matched[0].replace(/[^A-Z0-9]/g, '');
    if (normalized.startsWith('OD')) {
        return normalized;
    }

    return null;
}