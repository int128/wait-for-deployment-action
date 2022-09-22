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

test('active and destroyed', () => {
  expect(
    aggregate({
      repository: {
        object: {
          __typename: 'Commit',
          deployments: {
            nodes: [
              {
                environment: 'pr-727/app1',
                state: DeploymentState.Destroyed,
                latestStatus: {
                  description: 'Missing:\n',
                  logUrl: 'https://argocd.example.com/applications/app1',
                  environmentUrl: null,
                },
              },
              {
                environment: 'pr-727/app2',
                state: DeploymentState.Destroyed,
                latestStatus: {
                  description: 'Missing:\n',
                  logUrl: 'https://argocd.example.com/applications/app2',
                  environmentUrl: null,
                },
              },
              {
                environment: 'pr-727/app3',
                state: DeploymentState.Active,
                latestStatus: {
                  description: 'Succeeded:\nsuccessfully synced (all tasks run)',
                  logUrl: 'https://argocd.example.com/applications/app3',
                  environmentUrl: null,
                },
              },
            ],
          },
        },
      },
      rateLimit: {
        cost: 1,
      },
    })
  ).toStrictEqual<Outputs>({
    completed: true,
    success: true,
    summary: [
      '- :white_check_mark: pr-727/app3 ([active](https://argocd.example.com/applications/app3)): Succeeded:\nsuccessfully synced (all tasks run)',
    ],
  })
})
