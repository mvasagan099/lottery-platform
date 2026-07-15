import { describe, it, expect } from 'vitest'

function generateNumbers(pool: number, count: number): number[] {
  const nums = new Set<number>()
  while (nums.size < count) {
    nums.add(Math.floor(Math.random() * pool) + 1)
  }
  return Array.from(nums).sort((a, b) => a - b)
}

describe('Draw Engine Unit Tests', () => {
  it('should generate the correct number of random balls within the pool', () => {
    const nums = generateNumbers(45, 6)
    expect(nums.length).toBe(6)
    
    const allValid = nums.every(n => n >= 1 && n <= 45)
    expect(allValid).toBe(true)
    
    const unique = new Set(nums)
    expect(unique.size).toBe(6)
  })

  it('should generate a single ball for games with minNumbers=1', () => {
    const nums = generateNumbers(10, 1)
    expect(nums.length).toBe(1)
    expect(nums[0]).toBeGreaterThanOrEqual(1)
    expect(nums[0]).toBeLessThanOrEqual(10)
  })
})
