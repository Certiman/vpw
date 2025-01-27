import { VPWParser } from 'vpw-core';
import { ranking } from './ranking';
import type { InputPair, RankingResult } from './ranking';

async function main() {
    const parser = new VPWParser<InputPair, RankingResult>(
        'in.txt',
        'uit.txt',
        (line: string) => {
            const [name, score] = line.split(' ');
            return [name, Number(score)];
        },
        (line: string) => {
            const [testCase, ...rest] = line.split(' ');
            const [rank, name, score] = rest;
            return [Number(testCase), [Number(rank), name, Number(score)]];
        },
        undefined, // default compareOutputs
        true    // changed to false since we don't need to read test count
    );
    
    await parser.initialize();
    parser.runner(ranking);

    const errors = parser.errorInputs;
    const testCount = parser.testsExecuted;
    
    if (errors.length > 0) {
        console.log(`Found errors in ${errors.length}/${testCount} tests for inputs:`, errors);
    } else {
        console.log(`All ${testCount} tests passed!`);
    }
}

main().catch(console.error);