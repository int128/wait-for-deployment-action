import { aggregate, Outputs } from '../src/aggregate'
import { DeploymentState } from '../src/generated/graphql-types'

test('invalid query', () => {
  expect(() => aggregate({})).toThrow()
})

test('all pending', () => {
  expect(
    aggregate({
      rateLimit: {
        cost: 1,
      },
      repository: {
        object: {
          __typename: 'Commit',
          deployments: {
            nodes: [
              {
                environment: 'pr-2/app1',
                state: DeploymentState.Pending,
                latestStatus: null,
              },
              {
                environment: 'pr-2/app2',
                state: DeploymentState.Pending,
                latestStatus: null,
              },
              {
                environment: 'pr-2/app3',
                state: DeploymentState.Pending,
                latestStatus: null,
              },
            ],
          },
        },
      },
    })
  ).toStrictEqual<Outputs>({
    completed: false,
    success: false,
    summary: ['- pr-2/app1 (pending): ', '- pr-2/app2 (pending): ', '- pr-2/app3 (pending): '],
  })
})
