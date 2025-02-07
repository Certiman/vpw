import path from 'path';
import * as fs from 'fs';
import readline from 'readline';
import { slalom } from './slalom';

async function readFile(filename: string): Promise<string> {
    const baseDir = process.cwd();
    const fileURL = new URL(path.join(baseDir, 'src', filename), import.meta.url);
    try {
        return fs.readFileSync(fileURL.href, 'utf-8');
    } catch (e) {
        const response = await fetch(fileURL.href);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${filename}`);
        }
        return response.text();
    }
}

async function* readInputFileStream(inputFile: string): AsyncGenerator<number[][]> {
    const fileStream = fs.createReadStream(path.join(process.cwd(), 'src', inputFile));
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    let totalTests = 0;
    let currentTest = 0;
    let currentMatrix: number[][] | null = null;
    let remainingScores = 0;
    let width = 0, height = 0;

    for await (const line of rl) {
        if (line.trim() === '') continue;
        
        if (lineCount === 0) {
            totalTests = parseInt(line, 10);
            lineCount++;
            continue;
        }

        if (!currentMatrix) {
            // Start of a new test case
            [width, height, remainingScores] = line.split(' ').map(Number);
            currentMatrix = Array(height).fill(0).map(() => Array(width).fill(0));
            
            if (remainingScores === 0) {
                // Handle empty matrix case
                yield currentMatrix;
                currentMatrix = null;
                currentTest++;
            }
        } else {
            // Process score position
            const [x, y, score] = line.split(' ').map(Number);
            currentMatrix[y][x] = score;
            remainingScores--;

            if (remainingScores === 0) {
                yield currentMatrix;
                currentMatrix = null;
                currentTest++;
            }
        }
    }

    await rl.close();
    fileStream.close();
}

async function* readOutputFileStream(outputFile: string): AsyncGenerator<number> {
    const fileStream = fs.createReadStream(path.join(process.cwd(), 'src', outputFile));
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.trim() === '') continue;
        const [_, value] = line.split(' ').map(Number);
        yield value;
    }

    await rl.close();
    fileStream.close();
}

async function main(skipCases: number = 0) {
    const inputStream = readInputFileStream('ex.in');
    const outputStream = readOutputFileStream('ex.uit');
    let testCase = 1;

    // Skip the specified number of test cases
    for (let i = 0; i < skipCases; i++) {
        await inputStream.next();
        await outputStream.next();
        testCase++;
    }

    // Process remaining test cases
    for await (const matrix of inputStream) {
        console.log(`Processing test case ${testCase}${skipCases > 0 ? ` (after skipping ${skipCases})` : ''}`);
        const result = slalom(matrix);
        const expected = (await outputStream.next()).value;
        
        console.log(`Test case ${testCase}:`);
        if (result === expected) {
            console.log(`✓ Correct! Score: ${result}`);
        } else {
            console.error(`✗ Wrong! Got: ${result}, Expected: ${expected}`);
        }
        
        // Free up memory
        testCase++;
    }
}

// Parse command line arguments
const skip = parseInt(process.argv[2]) || 0;
main(skip).catch(console.error);
