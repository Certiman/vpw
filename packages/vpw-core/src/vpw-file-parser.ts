import path from 'path';
import * as fs from 'fs';

/**
 * Generic parser for Vlaamse Programmeerwedstrijd (VPW) input/output files.
 * Handles reading test cases and validating solutions against expected outputs.
 * 
 * @template TInput The type of the parsed input data
 * @template TOutput The type of the expected output data
 * @example
 * ```typescript
 * // Example for simple number inputs and array outputs
 * const parser = new VPWParser<number, number[]>(
 *   'input.txt',
 *   'output.txt',
 *   (line) => Number(line),
 *   (line) => {
 *     const [testCase, ...values] = line.split(' ');
 *     return [Number(testCase), values.map(Number)];
 *   }
 * );
 * 
 * // Example for complex input/output with test case numbers
 * const parser = new VPWParser<[string, number], [number, string, number]>(
 *   'input.txt',
 *   'output.txt',
 *   (line) => {
 *     const [name, score] = line.split(' ');
 *     return [name, Number(score)];
 *   },
 *   (line) => {
 *     const [testCase, rank, name, score] = line.split(' ');
 *     return [Number(testCase), [Number(rank), name, Number(score)]];
 *   },
 *   undefined,
 *   false  // when input file doesn't have a test count
 * );
 * ```
 */
export class VPWParser<TInput, TOutput> {
    private inputs: TInput[][] = [];
    private outputs = new Map<number, TOutput[]>();
    private inputs_with_errors: TInput[][] = [];
    private baseDir = process.cwd();
    private testCount: number = 0;

    /**
     * Creates a new VPW parser instance
     * @param inputFile - Path to the input file containing test cases
     * @param outputFile - Path to the output file containing expected results
     * @param parseInput - Function to parse a single line from the input file into TInput
     * @param parseOutput - Function to parse a single line from the output file into [testCase, TOutput] tuple
     * @param compareOutputs - Optional custom comparison function for outputs. Defaults to JSON.stringify equality
     * @param readInputCasesNumber - Whether to read test count from first line of input. Defaults to true
     *                              Set to false when input file doesn't start with a test count
     */
    constructor(
        private inputFile: string, 
        private outputFile: string,
        private parseInput: (value: string) => TInput,
        private parseOutput: (value: string) => [number, TOutput],
        private compareOutputs: (actual: TOutput, expected: TOutput) => boolean = 
            (a, b) => JSON.stringify(a) === JSON.stringify(b),
        private readInputCasesNumber: boolean = true
    ) {}

    /**
     * Initializes the parser by reading and validating input/output files
     * Must be called before using runner()
     * @throws Error if files are empty or have mismatched lengths
     */
    public async initialize(): Promise<void> {
        await this.readInputFile();
        await this.readOutputFile();
        this.validateFileLengths();
    }

    private async readFile(filename: string): Promise<string> {
        const fileURL = new URL(path.join(this.baseDir, 'src', filename), import.meta.url);
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

    private async readInputFile(): Promise<void> {
        const content = await this.readFile(this.inputFile);
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        // Check if all lines are pure numbers
        const isSimpleNumbersFile = lines.every(line => 
            !isNaN(Number(line)) && line.trim() === String(Number(line)));

        if (isSimpleNumbersFile) {
            // Simple case: each line is a single number
            const inputLines = this.readInputCasesNumber ? lines.slice(1) : lines;
            this.inputs = inputLines.map(line => [this.parseInput(line)]);
            this.testCount = this.inputs.length;
            return;
        }

        if (this.readInputCasesNumber) {
            // Complex case with test count in first line
            this.testCount = parseInt(lines[0], 10);
            let currentLine = 1;

            for (let testCase = 0; testCase < this.testCount; testCase++) {
                const potentialGroupCount = parseInt(lines[currentLine], 10);
                const parsed = this.parseInput(lines[currentLine]);
                
                if (!isNaN(potentialGroupCount) && String(potentialGroupCount) === lines[currentLine].trim()) {
                    // Group case: next line is a count
                    const groupCount = potentialGroupCount;
                    currentLine++;
                    
                    const group: TInput[] = [];
                    for (let i = 0; i < groupCount; i++) {
                        group.push(this.parseInput(lines[currentLine]));
                        currentLine++;
                    }
                    this.inputs.push(group);
                } else {
                    // Single case: just one input
                    this.inputs.push([parsed]);
                    currentLine++;
                }
            }
        } else {
            // When not reading test count, grouped inputs are not supported
            if (lines.some(line => !isNaN(parseInt(line)) && 
                String(parseInt(line)) === line.trim() && 
                parseInt(line) > 1)) {
                throw new Error('Grouped inputs are not supported when readInputCasesNumber is false');
            }
            
            // Process all lines as individual inputs
            this.inputs = lines.map(line => [this.parseInput(line)]);
            this.testCount = this.inputs.length;
        }
    }

    private async readOutputFile(): Promise<void> {
        const content = await this.readFile(this.outputFile);
        const groupedOutputs = new Map<number, TOutput[]>();

        content.split('\n')
            .filter(line => line.trim() !== '')
            .forEach(line => {
                const [index, value] = this.parseOutput(line);
                if (!groupedOutputs.has(index)) {
                    groupedOutputs.set(index, []);
                }
                groupedOutputs.get(index)?.push(value);
            });

        this.outputs = groupedOutputs;
    }

    private validateFileLengths(): void {
        const inputLength = this.inputs.length;
        const outputLength = this.outputs.size;
        
        if (inputLength === 0) {
            console.error('Inputs:', this.inputs);
            console.error('Outputs:', Object.fromEntries(this.outputs));
            throw new Error('No test cases found in input file');
        }
        
        if (inputLength !== outputLength) {
            console.error('Inputs:', this.inputs);
            console.error('Outputs:', Object.fromEntries(this.outputs));
            throw new Error(
                `Mismatched input/output lengths: ` +
                `input has ${inputLength} entries, ` +
                `output has ${outputLength} entries`
            );
        }
        this.testCount = inputLength;
        console.log(`Starting ${this.testCount} test cases from ${this.inputFile}`);
    }

    /**
     * Runs the provided function against all test cases and collects errors
     * @param fn - Function that transforms input of type TInput to output of type TOutput
     */
    public runner(fn: (input: TInput[]) => TOutput[]): void {
        this.inputs_with_errors = [];
        this.inputs.forEach((inputGroup, index) => {
            const expected = this.outputs.get(index + 1);
            if (!expected) {
                throw new Error(`No expected output found for test case ${index + 1}`);
            }

            const result = fn(inputGroup);
            if (!this.compareArrays(result, expected)) {
                console.error(`Test case ${index + 1} failed:`,
                    '\nInput:', inputGroup,
                    '\nExpected:', expected,
                    '\nGot:', result);
            }
        });
    }

    /**
     * Simplified runner for cases with single input/output values
     * @param fn - Function that transforms single input to single output
     */
    public simpleRunner(fn: (input: TInput) => TOutput): void {
        this.inputs_with_errors = [];
        this.inputs.forEach((inputGroup, index) => {
            const input = inputGroup[0]; // Take first item since it's a simple case
            const expected = this.outputs.get(index + 1)?.[0];
            if (!expected) {
                throw new Error(`No expected output found for test case ${index + 1}`);
            }

            const result = fn(input);
            if (!this.compareOutputs(result, expected)) {
                this.inputs_with_errors.push(inputGroup);
                console.error(`Test case ${index + 1} failed:`,
                    '\nInput:', input,
                    '\nExpected:', expected,
                    '\nGot:', result);
            }
        });
    }

    private compareArrays(actual: TOutput[], expected: TOutput[]): boolean {
        if (actual.length !== expected.length) return false;
        return actual.every((value, index) => 
            this.compareOutputs(value, expected[index])
        );
    }

    /**
     * @returns Array of input values that produced incorrect results
     */
    public get errorInputs(): TInput[][] {
        return this.inputs_with_errors;
    }

    /**
     * @returns Total number of test cases that were processed
     */
    public get testsExecuted(): number {
        return this.testCount;
    }
}