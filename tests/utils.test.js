import { findBestMatch } from '../src/utils/stringUtils';

describe('findBestMatch', () => {
    const mockMetaMap = new Map();
    mockMetaMap.set('contains-duplicate', { d: 'Easy', t: 'Arrays & Hashing' });
    mockMetaMap.set('valid-anagram', { d: 'Easy', t: 'Arrays & Hashing' });
    mockMetaMap.set('two-sum', { d: 'Easy', t: 'Arrays & Hashing' });

    it('should match exact slug', () => {
        const result = findBestMatch('Contains Duplicate', mockMetaMap);
        expect(result).toEqual({ d: 'Easy', t: 'Arrays & Hashing' });
    });

    it('should match NeetCode alias', () => {
        const result = findBestMatch('Duplicate Integer', mockMetaMap);
        expect(result).toEqual({ d: 'Easy', t: 'Arrays & Hashing' });
    });

    it('should match case insensitive', () => {
        const result = findBestMatch('valid anagram', mockMetaMap);
        expect(result).toEqual({ d: 'Easy', t: 'Arrays & Hashing' });
    });

    it('should return null for no match', () => {
        const result = findBestMatch('Non Existent Problem', mockMetaMap);
        expect(result).toBeNull();
    });

    it('should handle empty input', () => {
        expect(findBestMatch('', mockMetaMap)).toBeNull();
        expect(findBestMatch(null, mockMetaMap)).toBeNull();
    });
});
