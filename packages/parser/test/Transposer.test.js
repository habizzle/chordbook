import {describe, it, expect} from 'vitest';
import {transposeLine} from '../src/Transposer.js';

describe('transposeLine', () => {
    it('returns same line when keys equal', () => {
        const line = 'C  G  Am  F';
        expect(transposeLine(line, 'C', 'C')).toBe(line);
    });

    it('transposes simple progression from C to G', () => {
        const line = 'C  G  Am  F';
        const result = transposeLine(line, 'C', 'G');
        expect(result).toContain('G');
        expect(result).not.toContain('C');
    });

    it('throws on unsupported key', () => {
        expect(() => transposeLine('C G', 'C', 'Z')).toThrow();
    });
});
