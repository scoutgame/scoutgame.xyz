export function getRandomReward(isBonus = false) {
  const random = Math.random() * 100;

  const config = {
    regular: [
      [80, 1],
      [95, 2],
      [100, 5]
    ],
    bonus: [
      [80, 3],
      [95, 5],
      [100, 10]
    ]
  };

  const distribution = config[isBonus ? 'bonus' : 'regular'];

  return distribution.find(([threshold]) => random <= threshold)?.[1] ?? 1;
}
