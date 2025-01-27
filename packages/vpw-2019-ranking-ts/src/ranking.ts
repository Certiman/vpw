export type InputPair = [string, number];
export type RankingResult = [number, string, number];

export function ranking(participants: InputPair[]): RankingResult[] {
    // Sort by score descending
    const sorted = [...participants].sort((a, b) => b[1] - a[1]);
    
    let currentRank = 1;
    let previousScore = sorted[0]?.[1];
    
    return sorted.map((participant, index) => {
        const [name, score] = participant;
        
        // Only update rank if score changes
        if (score < previousScore) {
            currentRank = index + 1;
            previousScore = score;
        }
        
        return [currentRank, name, score];
    });
}
