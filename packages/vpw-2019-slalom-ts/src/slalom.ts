export function slalom(matrix: number[][]): number {
    if (!matrix || matrix.length === 0) return 0;
    
    const rows = matrix.length;
    const cols = matrix[0].length;
    const memo = new Map<string, number>();
    let bestScoreSoFar = -Infinity;
    
    // Pre-calculate maximum score possible for each row
    const maxScorePerRow: number[] = Array(rows).fill(0);
    for (let i = 0; i < rows; i++) {
        maxScorePerRow[i] = Math.max(...matrix[i]);
    }
    
    function dfs(row: number, col: number, currentScore: number): number {
        // Base cases
        if (col < 0 || col >= cols) return -Infinity;
        if (row === rows) return currentScore;
        
        // Early pruning: check if this path could possibly beat the best score
        let maxPossibleScore = currentScore;
        for (let r = row; r < rows; r++) {
            maxPossibleScore += maxScorePerRow[r];
        }
        if (maxPossibleScore <= bestScoreSoFar) {
            return -Infinity;
        }
        
        // Memoization key
        const key = `${row},${col},${currentScore}`;
        if (memo.has(key)) return memo.get(key)!;
        
        // Try all possible moves
        const score = Math.max(
            dfs(row + 1, col - 1, currentScore + matrix[row][col]),
            dfs(row + 1, col, currentScore + matrix[row][col]),
            dfs(row + 1, col + 1, currentScore + matrix[row][col])
        );
        
        bestScoreSoFar = Math.max(bestScoreSoFar, score);
        memo.set(key, score);
        return score;
    }
    
    // Try starting from each position in the first row
    let maxScore = -Infinity;
    for (let col = 0; col < cols; col++) {
        maxScore = Math.max(maxScore, dfs(0, col, 0));
    }
    
    return maxScore;
}
