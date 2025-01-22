# VPW Core

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Parser and test runner for Vlaamse Programmeerwedstrijd (VPW) solutions.

## Installation

```bash
# Using pnpm (recommended)
pnpm add vpw-core

# Using npm
npm install vpw-core

# Using yarn
yarn add vpw-core
```

## Quick start

```typescript
import { VPWParser } from 'vpw-core';

// Parser for array inputs and outputs
const parser = new VPWParser<number[], string[]>(
  'input.txt',
  'output.txt',
  (line) => line.split(' ').map(Number),
  (line) => {
    const [index, ...values] = line.split(' ');
    return [Number(index), values];
  }
);

parser.runner((inputs) => {
  // Process array of inputs
  return inputs.map(nums => nums.join(','));
});
```

## Input/Output Format

### Input File Formats

#### Simple Input

```
3        # Number of test cases
1        # Test case 1
2        # Test case 2
3        # Test case 3
```

#### Grouped Input

```
2        # Number of test cases
3        # Size of group 1
1 2 3    # Group 1, item 1
4 5 6    # Group 1, item 2
7 8 9    # Group 1, item 3
2        # Size of group 2
1 1      # Group 2, item 1
2 2      # Group 2, item 2
```

### Output File Format

```
1 result1    # Result for test case 1
2 result2    # Result for test case 2
```

## API Reference

### VPWParser<TInput, TOutput>

```typescript
class VPWParser<TInput, TOutput> {
  constructor(
    inputFile: string,          // Path to input file
    outputFile: string,         // Path to output file
    parseInput: (line: string) => TInput,
    parseOutput: (line: string) => [number, TOutput]
  )

  runner(fn: (input: TInput[]) => TOutput[]): void
}
```

### Type Parameters

- `TInput`: Type of parsed input data
- `TOutput`: Type of expected output data

### Complex example

Not supported is input like [this](https://github.com/vlaamseprogrammeerwedstrijd/opgaves/blob/master/2019/cat2/opmaak/voorbeeld.invoer).