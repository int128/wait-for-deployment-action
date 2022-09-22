import { aggregate } from '../src/run'

test('invalid query', () => {
  expect(() => aggregate({})).toThrow()
})
