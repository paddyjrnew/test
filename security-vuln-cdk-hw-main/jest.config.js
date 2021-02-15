module.exports = {
  moduleNameMapper: {
    '@services/(.*)': '<rootDir>/lib/services/$1',
    '@lambdas/(.*)': '<rootDir>/lib/lambdas/$1'
  },
  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
}
