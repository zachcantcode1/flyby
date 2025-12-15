export const HELICOPTER_CODES = new Set([
    'H125', 'AS50', 'AS55', 'AS65', 'EC20', 'EC30', 'EC35', 'EC45', 'EC55',
    'R22', 'R44', 'R66',
    'B06', 'B206', 'B407', 'B412', 'B429', 'B505',
    'S76', 'S92', 'UH1', 'UH60', 'H60', 'H47', 'CH47', 'AH64',
    'A109', 'A119', 'A139', 'AW139', 'A169', 'AW169', 'A189', 'AW189',
    'MD50', 'MD52', 'MD60', 'MD90',
    'CABG', 'R44', 'H500',
    // Add broad fallback for general types
]);

export function isHelicopter(code: string | null | undefined): boolean {
    if (!code) return false;
    return HELICOPTER_CODES.has(code.toUpperCase());
}
