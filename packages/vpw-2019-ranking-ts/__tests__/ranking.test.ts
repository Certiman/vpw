import { describe, test, expect } from 'vitest';
import { ranking } from '../src/ranking';

describe('ranking', () => {
    test('handles empty input', () => {
        expect(ranking([])).toEqual([]);
    });

    test('handles single participant', () => {
        expect(ranking([['Alice', 100]])).toEqual([[1, 'Alice', 100]]);
    });

    test('handles tied scores', () => {
        const input: [string, number][] = [
            ['Alice', 100],
            ['Bob', 100],
            ['Charlie', 90]
        ];
        expect(ranking(input)).toEqual([
            [1, 'Alice', 100],
            [1, 'Bob', 100],
            [3, 'Charlie', 90]
        ]);
    });

    test('handles descending scores', () => {
        const input: [string, number][] = [
            ['Alice', 100],
            ['Bob', 90],
            ['Charlie', 80]
        ];
        expect(ranking(input)).toEqual([
            [1, 'Alice', 100],
            [2, 'Bob', 90],
            [3, 'Charlie', 80]
        ]);
    });

    test('handles unsorted input', () => {
        const input: [string, number][] = [
            ['Bob', 90],
            ['Alice', 100],
            ['Charlie', 80]
        ];
        expect(ranking(input)).toEqual([
            [1, 'Alice', 100],
            [2, 'Bob', 90],
            [3, 'Charlie', 80]
        ]);
    });

    test('handles multiple ties', () => {
        const input: [string, number][] = [
            ['Alice', 100],
            ['Bob', 100],
            ['Charlie', 90],
            ['David', 90],
            ['Eve', 90],
            ['Frank', 80]
        ];
        expect(ranking(input)).toEqual([
            [1, 'Alice', 100],
            [1, 'Bob', 100],
            [3, 'Charlie', 90],
            [3, 'David', 90],
            [3, 'Eve', 90],
            [6, 'Frank', 80]
        ]);
    });
});