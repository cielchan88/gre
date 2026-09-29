// Hand-written Quantitative items (original content). Generated items live in gen-quant.js.
import { frac } from './util.js';
const Q = 'Q';
const qc = (id, difficulty, topic, info, qa, qb, answer, explain) => ({ id, section: Q, type: 'qc', topic, difficulty, info, qa, qb, answer, explain });
const mc = (id, difficulty, topic, stem, options, answer, explain, extra = {}) => ({ id, section: Q, type: Array.isArray(answer) ? 'mcn' : 'mc1', topic, difficulty, stem, options, answer, explain, ...extra });
const ne = (id, difficulty, topic, stem, answer, explain, extra = {}) => ({ id, section: Q, type: 'ne', topic, difficulty, stem, answer, explain, ...extra });

export const QUANT_STATIC = [
  // ── Quantitative Comparison ──
  qc('q-qc-01', 2, 'algebra', 'x > 0', 'x', 'x<sup>2</sup>', 3, 'Try x = 1 (equal), x = 2 (B greater), x = 0.5 (A greater). Different values give different results, so the relationship cannot be determined.'),
  qc('q-qc-02', 3, 'algebra', '0 < x < 1', 'x', 'x<sup>2</sup>', 0, 'Multiplying a number between 0 and 1 by itself makes it smaller (e.g. 0.5 vs 0.25), so A is greater.'),
  qc('q-qc-03', 3, 'algebra', 'n is an integer greater than 1', 'n<sup>2</sup>', '2n', 3, 'n = 2 gives 4 and 4 (equal); n = 3 gives 9 and 6 (A greater). The relationship cannot be determined.'),
  qc('q-qc-04', 2, 'arithmetic', null, '15% of 200', '30', 2, '0.15 × 200 = 30, so the quantities are equal.'),
  qc('q-qc-05', 3, 'algebra', 'x > 0', '(x + 1)<sup>2</sup>', 'x<sup>2</sup> + 2x', 0, 'Expand: (x+1)² = x² + 2x + 1, which is exactly 1 more than B. A is greater.'),
  qc('q-qc-06', 3, 'arithmetic', '0 < x < y', frac('x', 'y'), frac('x + 1', 'y + 1'), 1, 'Adding the same positive number to numerator and denominator of a fraction less than 1 moves it closer to 1, so B is larger. (Try x = 1, y = 2: 1/2 vs 2/3.)'),
  qc('q-qc-07', 4, 'algebra', 'x<sup>2</sup> = 16 and y<sup>2</sup> = 25', 'x + y', '0', 3, 'x could be ±4 and y could be ±5, so x + y could be 9, 1, −1, or −9. The sign can go either way, so it cannot be determined.'),
  qc('q-qc-08', 3, 'geometry', null, 'The circumference of a circle with radius 4', 'The perimeter of a square with side length 8', 1, 'Circumference = 8π ≈ 25.1. Perimeter = 32. B is greater.'),
  qc('q-qc-09', 4, 'algebra', 'x and y are integers and x + y = 10', 'xy', '24', 3, 'x = y = 5 gives xy = 25 (A greater); x = 1, y = 9 gives 9 (B greater). Cannot be determined.'),
  qc('q-qc-10', 2, 'arithmetic', '0 < a < b < 1', frac('a', 'b'), frac('b', 'a'), 1, 'Since a < b, a/b < 1 and b/a > 1. B is greater.'),
  qc('q-qc-11', 3, 'arithmetic', null, '4<sup>−2</sup>', '2<sup>−4</sup>', 2, '4⁻² = 1/16 and 2⁻⁴ = 1/16. Equal.'),
  qc('q-qc-12', 4, 'arithmetic', null, 'The number of integers from 1 to 100 that are divisible by 6', 'The number of integers from 1 to 100 that are divisible by 7', 0, '⌊100/6⌋ = 16 and ⌊100/7⌋ = 14. A is greater.'),
  qc('q-qc-13', 5, 'data', 'The average (arithmetic mean) of three distinct positive integers is 10.', 'The greatest possible value of one of the integers', '27', 2, 'The sum is 30. To maximize one integer, make the other two as small as possible and distinct: 1 and 2. Then the largest is 30 − 3 = 27. Equal.'),
  qc('q-qc-14', 4, 'data', 'Two fair six-sided dice are rolled.', 'The probability that the sum is 8', frac(1, 7), 1, 'Five of the 36 outcomes sum to 8: 5/36 ≈ 0.139. 1/7 ≈ 0.143. B is slightly greater.'),
  qc('q-qc-15', 4, 'data', null, 'The standard deviation of {2, 4, 6, 8, 10}', 'The standard deviation of {12, 14, 16, 18, 20}', 2, 'The second set is the first set shifted by 10. Adding a constant to every value does not change the spread, so the standard deviations are equal.'),
  qc('q-qc-16', 5, 'algebra', 'x is a nonzero number', '(x + 1/x)<sup>2</sup>', '4', 3, 'Expanding, (x + 1/x)\u00B2 = x\u00B2 + 2 + 1/x\u00B2 \u2265 4 for every nonzero x, with equality exactly when x = 1 or x = \u22121. So A is greater for most values of x but equal for x = \u00B11: the relationship cannot be determined.'),
  qc('q-qc-17', 5, 'geometry', 'In triangle PQR, PQ = 7 and QR = 10.', 'PR', '3', 0, 'By the triangle inequality, PR > 10 − 7 = 3. So PR is greater than 3 for any valid triangle. A is greater.'),
  qc('q-qc-18', 2, 'word', 'A store sells 3 notebooks for $4.50.', 'The cost of 8 notebooks at this rate', '$12.00', 2, 'Each notebook costs $1.50. 8 × 1.50 = $12.00. Equal.'),

  // ── Multiple choice (one answer) ──
  mc('q-mc-01', 2, 'word', 'A store sells pens at 3 for $2. At this rate, what is the cost of 15 pens?', ['$8', '$10', '$12', '$15', '$30'], 1, '15 pens is 5 groups of 3, so the cost is 5 × $2 = $10.'),
  mc('q-mc-02', 3, 'algebra', 'If 2<sup>x+1</sup> = 32, what is the value of x?', ['3', '4', '5', '6', '16'], 1, '32 = 2⁵, so x + 1 = 5 and x = 4.'),
  mc('q-mc-03', 3, 'data', 'The average (arithmetic mean) of x, 2x, and 3x is 12. What is the value of x?', ['2', '4', '6', '8', '12'], 2, '(x + 2x + 3x)/3 = 2x = 12, so x = 6.'),
  mc('q-mc-04', 4, 'arithmetic', 'If x/y = 3/4 and y/z = 2/5, what is the value of x/z?', [frac(3, 10), frac(3, 5), frac(8, 15), frac(15, 8), frac(10, 3)], 0, 'x/z = (x/y)(y/z) = (3/4)(2/5) = 6/20 = 3/10.'),
  mc('q-mc-05', 4, 'geometry', 'A rectangular garden has a length that is 3 times its width. If the perimeter of the garden is 96 meters, what is its area, in square meters?', ['108', '216', '288', '432', '576'], 3, 'Perimeter = 2(w + 3w) = 8w = 96, so w = 12 and length = 36. Area = 12 × 36 = 432.'),
  mc('q-mc-06', 3, 'arithmetic', 'The value of a stock rose 20 percent in one year and then fell 20 percent the next year. Compared with its value at the start, its value at the end of the two years was', ['unchanged', '4% lower', '2% lower', '4% higher', '20% lower'], 1, '1.20 × 0.80 = 0.96, so the final value is 96% of the original: 4% lower.'),
  mc('q-mc-07', 4, 'arithmetic', 'If n is a positive integer and n<sup>2</sup> is divisible by 72, what is the least possible value of n?', ['6', '12', '18', '24', '36'], 1, '72 = 2³ × 3². For n² every prime exponent must be even, so n² needs at least 2⁴ × 3². Then n = 2² × 3 = 12.'),
  mc('q-mc-08', 3, 'algebra', 'How many integers x satisfy the inequality |x − 3| ≤ 4?', ['7', '8', '9', '10', '11'], 2, '−4 ≤ x − 3 ≤ 4 gives −1 ≤ x ≤ 7. The integers −1 through 7 number 9.'),
  mc('q-mc-09', 5, 'algebra', 'If x + 1/x = 5, what is the value of x<sup>2</sup> + 1/x<sup>2</sup>?', ['10', '21', '23', '25', '27'], 2, 'Square both sides: x² + 2 + 1/x² = 25, so x² + 1/x² = 23.'),
  mc('q-mc-10', 5, 'word', 'A tank is filled by pipe A in 6 hours and drained by pipe B in 9 hours. If both pipes are opened when the tank is empty, how many hours will it take to fill the tank?', ['12', '15', '18', '24', '36'], 2, 'Net rate = 1/6 − 1/9 = 3/18 − 2/18 = 1/18 tank per hour. So it takes 18 hours.'),
  mc('q-mc-11', 5, 'data', 'A committee of 3 is to be formed from 5 men and 4 women. If the committee must include at least one woman, how many different committees are possible?', ['74', '78', '80', '84', '90'], 0, 'Total committees C(9,3) = 84. All-male committees C(5,3) = 10. So 84 − 10 = 74.'),
  mc('q-mc-12', 4, 'geometry', 'In the xy-plane, line k passes through the points (0, 3) and (4, 0). What is the slope of a line perpendicular to k?', [frac('−4', 3), frac('−3', 4), frac(3, 4), frac(4, 3), '4'], 3, 'Slope of k = (0 − 3)/(4 − 0) = −3/4. A perpendicular line has slope equal to the negative reciprocal: 4/3.'),
  mc('q-mc-13', 5, 'geometry', 'A cylinder has a radius of 3 and a height of 5. If its radius is doubled and its height is halved, the volume of the new cylinder is how many times the volume of the original?', ['½', '1', '³⁄₂', '2', '4'], 3, 'Volume ∝ r²h. New/old = (2)² × (½) = 2.'),
  mc('q-mc-14', 3, 'word', 'A shirt is on sale for $36, which is 40 percent off the original price. What was the original price?', ['$50', '$54', '$60', '$64', '$90'], 2, 'The sale price is 60% of the original: 0.6P = 36, so P = 60.'),

  // ── Multiple choice (select all) ──
  mc('q-mcn-01', 2, 'algebra', 'If x is an integer and 3 < |x| < 6, which of the following could be the value of x? Indicate <em>all</em> such values.', ['−5', '−3', '0', '3', '4', '6'], [0, 4], '3 < |x| < 6 means |x| is 4 or 5 for integers, so x is −5, −4, 4, or 5. Only −5 and 4 are listed.'),
  mc('q-mcn-02', 3, 'arithmetic', 'Which of the following numbers are prime? Indicate <em>all</em> such numbers.', ['51', '57', '59', '61', '63', '91'], [2, 3], '51 = 3×17, 57 = 3×19, 63 = 7×9, 91 = 7×13. Only 59 and 61 are prime.'),
  mc('q-mcn-03', 4, 'arithmetic', 'If a and b are integers and ab = 12, which of the following could be the value of a + b? Indicate <em>all</em> such values.', ['7', '8', '9', '10', '13', '−8'], [0, 1, 4, 5], 'Integer pairs with product 12: (1,12) → 13, (2,6) → 8, (3,4) → 7, and the negative pairs give −13, −8, −7. So 7, 8, 13, and −8 are possible.'),
  mc('q-mcn-04', 2, 'arithmetic', 'If x is a positive integer and 30/x is an integer, which of the following could be the value of x? Indicate <em>all</em> such values.', ['4', '5', '6', '10', '12', '15'], [1, 2, 3, 5], 'x must be a divisor of 30: 1, 2, 3, 5, 6, 10, 15, 30. From the list: 5, 6, 10, 15.'),
  mc('q-mcn-05', 4, 'geometry', 'Two sides of a triangle have lengths 5 and 9. Which of the following could be the length of the third side? Indicate <em>all</em> such values.', ['3', '4', '5', '10', '13', '14'], [2, 3, 4], 'The third side s must satisfy 9 − 5 < s < 9 + 5, i.e. 4 < s < 14. So 5, 10, and 13 work; 4 and 14 are strictly excluded.'),

  // ── Numeric entry ──
  ne('q-ne-01', 3, 'arithmetic', 'What is 20% of 40% of 250?', { value: 20 }, '40% of 250 = 100, and 20% of 100 = 20.'),
  ne('q-ne-02', 2, 'algebra', 'The sum of two numbers is 47 and their difference is 13. What is the larger number?', { value: 30 }, 'Larger = (47 + 13)/2 = 30.'),
  ne('q-ne-03', 4, 'arithmetic', 'How many positive integers less than 200 are multiples of both 6 and 8?', { value: 8 }, 'Multiples of both are multiples of LCM(6, 8) = 24. The multiples of 24 below 200 are 24, 48, …, 192: that is 8 numbers.'),
  ne('q-ne-04', 4, 'word', 'A recipe calls for flour and sugar in the ratio 5 : 2. If a baker uses 35 cups of flour, how many cups of sugar are needed?', { value: 14 }, 'The ratio gives sugar = 35 × 2/5 = 14.'),
  ne('q-ne-05', 5, 'algebra', 'If 3<sup>x</sup> · 9<sup>x</sup> = 81, what is the value of x?', { value: 4 / 3 }, 'Rewrite with base 3: 3ˣ · 3²ˣ = 3³ˣ = 3⁴, so 3x = 4 and x = 4/3. (Enter as a fraction or decimal.)', { fraction: true }),
  ne('q-ne-06', 5, 'data', 'A set of 5 numbers has an average of 12 and a median of 10. If the smallest number is 4 and the largest is 20, what is the sum of the other two numbers that are not the median? (The five numbers, in order, are 4, a, 10, b, 20.)', { value: 26 }, 'The total is 5 × 12 = 60. So 4 + a + 10 + b + 20 = 60, giving a + b = 26.'),
];
