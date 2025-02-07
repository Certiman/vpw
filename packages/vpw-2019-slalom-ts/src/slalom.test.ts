import { describe, test, expect } from 'vitest';
import { slalom } from './slalom';
import path from 'path';
import * as fs from 'fs';

describe('slalom', () => {
    test('empty matrix returns 0', () => {
        expect(slalom([])).toBe(0);
    });

    test('single cell matrix returns its value', () => {
        expect(slalom([[7]])).toBe(7);
    });

    test('multi-row single-column sums all values', () => {
        expect(slalom([[2], [5], [3]])).toBe(10);
    });

    test('ex.in test cases match ex.uit', () => {
        const baseDir = process.cwd();
        const exInContent = fs.readFileSync(path.join(baseDir, 'src', 'ex.in'), 'utf-8');
        const exUitContent = fs.readFileSync(path.join(baseDir, 'src', 'ex.uit'), 'utf-8');

        // Parse ex.in
        const lines = exInContent.split('\n').filter((x) => x.trim() !== '');
        const totalTests = parseInt(lines[0], 10);
        let currentLine = 1;
        const testMatrices: number[][][] = [];

        for (let t = 0; t < totalTests; t++) {
            const [width, height, scoredCount] = lines[currentLine++].split(' ').map(Number);
            const matrix = Array(height)
                .fill(0)
                .map(() => Array(width).fill(0));
            for (let i = 0; i < scoredCount; i++) {
                const [x, y, score] = lines[currentLine++].split(' ').map(Number);
                matrix[y][x] = score;
            }
            testMatrices.push(matrix);
        }

        // Parse ex.uit
        const expectedScores = exUitContent
            .split('\n')
            .filter((x) => x.trim() !== '')
            .map((line) => {
                const [_, value] = line.split(' ').map(Number);
                return value;
            });

        // Check each test case
        expect(testMatrices.length).toBe(expectedScores.length);
        for (let i = 0; i < testMatrices.length; i++) {
            const result = slalom(testMatrices[i]);
            const expected = expectedScores[i];
            expect(result).toBe(expected);
        }
    });
});
