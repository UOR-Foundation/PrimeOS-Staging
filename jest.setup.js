// Add missing reconstructFromFactors function that tests rely on
global.reconstructFromFactors = function reconstructFromFactors(factors) {
  return factors.reduce((product, factor) => {
    // For BigInt values, we need to use BigInt exponentiation
    let contribution = 1n;
    let base = factor.prime;
    
    // Manual exponentiation for BigInt values
    for (let i = 0; i < factor.exponent; i++) {
      contribution *= base;
    }
    
    // Multiply it with our running product
    return product * contribution;
  }, 1n);
}
