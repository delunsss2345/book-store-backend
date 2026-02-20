import { parseBigIntOptional, parseBigIntRequired } from '@/utils/parseBigInt.util';

describe('parseBigInt.util', () => {
    it('should parse required bigint', () => {
        expect(parseBigIntRequired('123', 'id')).toBe(123n);
    });

    it('should throw for missing required bigint', () => {
        expect(() => parseBigIntRequired(undefined, 'id')).toThrow('id is required');
    });

    it('should throw for invalid required bigint', () => {
        expect(() => parseBigIntRequired('abc', 'id')).toThrow('id must be a bigint');
    });

    it('should parse optional bigint', () => {
        expect(parseBigIntOptional('456')).toBe(456n);
    });

    it('should return undefined for missing optional bigint', () => {
        expect(parseBigIntOptional(undefined)).toBeUndefined();
    });

    it('should return undefined for invalid optional bigint', () => {
        expect(parseBigIntOptional('abc')).toBeUndefined();
    });
});
