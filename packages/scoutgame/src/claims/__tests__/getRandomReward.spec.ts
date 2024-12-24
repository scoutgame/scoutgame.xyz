import { jest } from '@jest/globals';

import { getRandomReward } from '../getRandomReward';

describe('getRandomReward', () => {
  let mockRandom: jest.SpiedFunction<() => number>;

  beforeEach(() => {
    // Mock Math.random before each test
    mockRandom = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    // Restore Math.random after each test
    mockRandom.mockRestore();
  });

  describe('regular rewards', () => {
    it('should return 1 for random value <= 80', () => {
      mockRandom.mockReturnValue(0.8); // 80%
      expect(getRandomReward()).toBe(1);
    });

    it('should return 2 for random value between 80 and 95', () => {
      mockRandom.mockReturnValue(0.94); // 94%
      expect(getRandomReward()).toBe(2);
    });

    it('should return 5 for random value between 95 and 100', () => {
      mockRandom.mockReturnValue(0.99); // 99%
      expect(getRandomReward()).toBe(5);
    });
  });

  describe('bonus rewards', () => {
    it('should return 3 for random value <= 80', () => {
      mockRandom.mockReturnValue(0.8); // 80%
      expect(getRandomReward(true)).toBe(3);
    });

    it('should return 5 for random value between 80 and 95', () => {
      mockRandom.mockReturnValue(0.94); // 94%
      expect(getRandomReward(true)).toBe(5);
    });

    it('should return 10 for random value between 95 and 100', () => {
      mockRandom.mockReturnValue(0.99); // 99%
      expect(getRandomReward(true)).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should return 1 for regular rewards when random is 0', () => {
      mockRandom.mockReturnValue(0);
      expect(getRandomReward()).toBe(1);
    });

    it('should return 3 for bonus rewards when random is 0', () => {
      mockRandom.mockReturnValue(0);
      expect(getRandomReward(true)).toBe(3);
    });
  });
});
