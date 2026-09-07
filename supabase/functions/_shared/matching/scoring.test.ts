import { describe, expect, it } from 'vitest'
import {
  calculateEducationScore,
  calculateExperienceScore,
  calculateKeywordsScore,
  calculateLocationScore,
  calculateSkillsScore,
  classifyScore,
  recommendationFor,
} from './scoring.ts'
import type { CVEducation, CVExperience } from '../ai/types.ts'

describe('calculateSkillsScore', () => {
  it('scores 100 when every required and preferred skill is present', () => {
    const { score, missing } = calculateSkillsScore(
      ['SQL', 'Power BI', 'Python'],
      ['SQL', 'Power BI'],
      ['Python'],
    )
    expect(score).toBe(100)
    expect(missing).toEqual([])
  })

  it('is case- and accent-insensitive', () => {
    const { score, missing } = calculateSkillsScore(['sql', 'powerbi'], ['SQL'], ['PowerBI'])
    expect(score).toBe(100)
    expect(missing).toEqual([])
  })

  it('weights required skills at 75% and preferred at 25%', () => {
    // 0/1 required, 1/1 preferred => 0*0.75 + 1*0.25 = 25
    const { score } = calculateSkillsScore(['Excel'], ['SQL'], ['Excel'])
    expect(score).toBe(25)
  })

  it('lists the required skills the candidate is missing', () => {
    const { missing } = calculateSkillsScore(['SQL'], ['SQL', 'Azure', 'Docker'], [])
    expect(missing).toEqual(['Azure', 'Docker'])
  })

  it('treats an empty required list as fully satisfied (ratio 1)', () => {
    const { score, missing } = calculateSkillsScore([], [], [])
    expect(score).toBe(100)
    expect(missing).toEqual([])
  })

  it('never goes below 0 or above 100', () => {
    const { score } = calculateSkillsScore([], ['SQL', 'Azure'], ['Docker'])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

function experience(startYear: number, endYear?: number): CVExperience {
  return {
    company: 'Acme',
    title: 'Analyst',
    start_date: String(startYear),
    end_date: endYear ? String(endYear) : undefined,
  }
}

describe('calculateExperienceScore', () => {
  it('caps at 100 once years meet or exceed the seniority target', () => {
    expect(calculateExperienceScore([experience(2020, 2026)], 'junior')).toBe(100) // 6y >= 1y target
    expect(calculateExperienceScore([experience(2020, 2026)], 'senior')).toBe(100) // 6y >= 6y target
  })

  it('is proportional below the target', () => {
    // 3 years experience vs a 6-year "senior" target => 50%
    expect(calculateExperienceScore([experience(2020, 2023)], 'senior')).toBe(50)
  })

  it('treats a missing end_date as ongoing (counts through the current year)', () => {
    const currentYear = new Date().getFullYear()
    const score = calculateExperienceScore([experience(currentYear - 1)], 'junior')
    expect(score).toBe(100)
  })

  it('sums multiple experience entries', () => {
    // 2 + 2 = 4 years vs a 3-year "intermediate" target => capped at 100
    const exps = [experience(2018, 2020), experience(2021, 2023)]
    expect(calculateExperienceScore(exps, 'intermediate')).toBe(100)
  })

  it('returns 0 for no experience against a non-zero target', () => {
    expect(calculateExperienceScore([], 'senior')).toBe(0)
  })

  it('falls back to a default target for an unrecognized seniority label', () => {
    // Unknown label defaults to a 2-year target; 2 years => 100
    expect(calculateExperienceScore([experience(2024, 2026)], 'staff-plus')).toBe(100)
  })

  it('is case-insensitive on the seniority label', () => {
    expect(calculateExperienceScore([experience(2020, 2026)], 'SENIOR')).toBe(100)
  })
})

describe('calculateEducationScore', () => {
  it('returns a neutral-low baseline with no education on file', () => {
    expect(calculateEducationScore([])).toBe(40)
  })

  it('scores 100 when the field of study is relevant', () => {
    const education: CVEducation[] = [{ institution: 'UCAD', degree: 'Master 2', field: 'Business Intelligence' }]
    expect(calculateEducationScore(education)).toBe(100)
  })

  it('scores 100 when relevance is only in the degree name', () => {
    const education: CVEducation[] = [{ institution: 'UCAD', degree: 'Master en Data Science' }]
    expect(calculateEducationScore(education)).toBe(100)
  })

  it('scores 70 for an unrelated field', () => {
    const education: CVEducation[] = [{ institution: 'UCAD', degree: 'Licence', field: 'Droit' }]
    expect(calculateEducationScore(education)).toBe(70)
  })
})

describe('calculateLocationScore', () => {
  it('rewards a remote job when the user wants remote', () => {
    expect(calculateLocationScore('Full Remote', [], 'remote')).toBe(100)
  })

  it('penalizes an on-site job when the user wants remote', () => {
    expect(calculateLocationScore('Paris, France', [], 'remote')).toBe(30)
  })

  it('gives a neutral-positive score with no job location and an "any" preference', () => {
    expect(calculateLocationScore(null, ['Dakar'], 'any')).toBe(70)
  })

  it('gives a neutral-low score with no job location and a specific preference', () => {
    expect(calculateLocationScore(null, ['Dakar'], 'onsite')).toBe(50)
  })

  it('matches a preferred location', () => {
    expect(calculateLocationScore('Dakar, Sénégal', ['Dakar'], 'onsite')).toBe(100)
  })

  it('treats a remote posting as a match even without an explicit remote preference', () => {
    expect(calculateLocationScore('Remote (worldwide)', ['Dakar'], 'onsite')).toBe(100)
  })

  it('gives a middling score for no match with a flexible preference', () => {
    expect(calculateLocationScore('Berlin, Germany', ['Dakar'], 'hybrid')).toBe(60)
  })

  it('gives a low score for no match with an onsite-only preference', () => {
    expect(calculateLocationScore('Berlin, Germany', ['Dakar'], 'onsite')).toBe(30)
  })
})

describe('calculateKeywordsScore', () => {
  it('returns a neutral score when the job description is empty', () => {
    expect(calculateKeywordsScore('SQL Python Power BI', '')).toBe(50)
  })

  it('scores 100 for strong keyword overlap', () => {
    const cv = 'Experience with Python SQL PowerBI dashboards analytics'
    const job = 'Looking for Python SQL PowerBI analytics experience'
    expect(calculateKeywordsScore(cv, job)).toBe(100)
  })

  it('scores 0 for no keyword overlap', () => {
    const cv = 'Baking bread pastry cakes desserts'
    const job = 'Requires welding metalwork construction'
    expect(calculateKeywordsScore(cv, job)).toBe(0)
  })

  it('ignores short filler words and stopwords', () => {
    // "the", "and", "for" are stopwords/too short and should not count as matches
    const cv = 'the and for'
    const job = 'the and for'
    expect(calculateKeywordsScore(cv, job)).toBe(50) // no meaningful tokens on either side -> treated as job having 0 tokens
  })
})

describe('classifyScore', () => {
  it.each([
    [100, 'EXCELLENT_MATCH'],
    [90, 'EXCELLENT_MATCH'],
    [89, 'GREAT_MATCH'],
    [75, 'GREAT_MATCH'],
    [74, 'GOOD_MATCH'],
    [60, 'GOOD_MATCH'],
    [59, 'TO_REVIEW'],
    [40, 'TO_REVIEW'],
    [39, 'WEAK_MATCH'],
    [0, 'WEAK_MATCH'],
  ] as const)('classifies %i as %s', (score, expected) => {
    expect(classifyScore(score)).toBe(expected)
  })
})

describe('recommendationFor', () => {
  it('returns a non-empty recommendation for every known classification', () => {
    for (const classification of ['EXCELLENT_MATCH', 'GREAT_MATCH', 'GOOD_MATCH', 'TO_REVIEW', 'WEAK_MATCH']) {
      expect(recommendationFor(classification)).not.toBe('')
    }
  })

  it('returns an empty string for an unknown classification', () => {
    expect(recommendationFor('SOMETHING_ELSE')).toBe('')
  })
})
