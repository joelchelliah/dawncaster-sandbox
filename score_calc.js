function calculateScore(query) {
  const BASE_POINTS = {
    L: 170, // Legendary
    R: 113, // Rare
    U: 75, // Uncommon
    C: 50, // Common
    M: 50, // Monster
    X: 0, // Unscored
  };

  // Extract values from query string
  const cardsMatch = query.match(/\d+[LRUCMX]/g);
  const malignancyMatch = query.match(/(\d+)%/);
  const rangeMatch = query.match(/(\d+)-(\d+)/);

  // Initialize variables
  let deckSize = 0;
  let totalCardPoints = 0;
  let baseAccuracyBonus = 3000;

  // Parse malignancy
  if (!malignancyMatch) {
    console.error("Error: Malignancy percentage not found in the input");
    return;
  }

  console.log("Malignancy:", malignancyMatch[0]);
  const malignancyMultiplier = 1 + parseInt(malignancyMatch[1]) / 100;

  // Parse cards
  if (!cardsMatch) {
    console.error("Error: No valid cards found in the input");
    return;
  }

  console.log("Cards:", cardsMatch);
  cardsMatch.forEach((entry) => {
    const [_, countString, type] = entry.match(/(\d+)([LRUCMX])/);
    const points = BASE_POINTS[type];
    const count = parseInt(countString);

    totalCardPoints += count * Math.ceil(points * malignancyMultiplier);
    deckSize += count;
  });

  // Parse accuracy bonus range
  if (!rangeMatch) {
    console.error("Error: Deck size range not found in the input");
    return;
  }

  console.log("Range:", rangeMatch[0]);
  let minDeck = parseInt(rangeMatch[1]);
  let maxDeck = parseInt(rangeMatch[2]);
  let middle = Math.floor((minDeck + maxDeck) / 2);
  let windowSize = maxDeck - middle + 1;

  // Apply accuracy penalty
  if (deckSize < minDeck || deckSize > maxDeck) {
    let stepsOutside = Math.ceil(
      Math.abs(deckSize - (deckSize < minDeck ? minDeck : maxDeck)) / windowSize
    );
    baseAccuracyBonus -= stepsOutside * (3000 * 0.1);
  }

  console.log("Base Accuracy Bonus:", baseAccuracyBonus);

  const accuracyBonus = Math.floor(baseAccuracyBonus * malignancyMultiplier);

  // score
  let score = totalCardPoints + accuracyBonus;
  const fixedPoints = 2000 + 1000;

  // Add completion bonus
  let finalScore = Math.floor(score + fixedPoints);

  console.log("Card Bonus:", totalCardPoints);
  console.log("Accuracy Bonus:", accuracyBonus);
  console.log("Fixed Points:", fixedPoints);
  console.log("____________________");
  console.log("Final Score:", finalScore);
  console.log("====================");
}

// Test cases
// 5L 9R 3U 6C 2X 145% 24-26 Should return 16218
// 45L 1R 1U 150% 24-26 Should return 21845

// Process command-line arguments
if (process.argv.length > 2) {
  // Get all arguments after "node score_calc.js"
  const args = process.argv.slice(2);

  // Join the arguments into a query string
  const queryString = args.join(" ");

  console.log("Input Query:", queryString);
  calculateScore(queryString);
} else {
  console.log("Please provide input in the format:");
  console.log("node score_calc.js 5L 9R 3U 6C 2X 145% 24-26");
}
