import { aggregate, Outputs } from '../src/aggregate.js'
import { DeploymentState } from '../src/generated/graphql-types.js'

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
    }),
  ).toStrictEqual<Outputs>({
    progressing: false,
    failed: false,
    completed: false,
    succeeded: false,
    summary: ['- pr-2/app1: pending: ', '- pr-2/app2: pending: ', '- pr-2/app3: pending: '].join('\n'),
  })
})

test('progressing', () => {
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
                state: DeploymentState.InProgress,
                latestStatus: null,
              },
              {
                environment: 'pr-2/app3',
                state: DeploymentState.Queued,
                latestStatus: null,
              },
            ],
          },
        },
      },
    }),
  ).toStrictEqual<Outputs>({
    progressing: true,
    failed: false,
    completed: false,
    succeeded: false,
    summary: ['- pr-2/app1: pending: ', '- pr-2/app2: :rocket: in progress: ', '- pr-2/app3: :rocket: queued: '].join(
      '\n',
    ),
  })
})

test('any failed', () => {
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
                state: DeploymentState.InProgress,
                latestStatus: null,
              },
              {
                environment: 'pr-2/app3',
                state: DeploymentState.Failure,
                latestStatus: null,
              },
            ],
          },
        },
      },
    }),
  ).toStrictEqual<Outputs>({
    progressing: true,
    failed: true,
    completed: false,
    succeeded: false,
    summary: ['- pr-2/app1: pending: ', '- pr-2/app2: :rocket: in progress: ', '- pr-2/app3: :x: failure: '].join('\n'),
  })
})

test('all active', () => {
  expect(
    aggregate({
      repository: {
        object: {
          __typename: 'Commit',
          deployments: {
            nodes: [
              {
                environment: 'pr-727/app1',
                state: DeploymentState.Active,
                latestStatus: {
                  description: 'Succeeded:\nsuccessfully synced (all tasks run)',
                  logUrl: 'https://argocd.example.com/applications/app1',
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
    }),
  ).toStrictEqual<Outputs>({
    progressing: false,
    failed: false,
    completed: true,
    succeeded: true,
    summary: [
      '- pr-727/app1: :white_check_mark: [active](https://argocd.example.com/applications/app1): Succeeded:\nsuccessfully synced (all tasks run)',
      '- pr-727/app3: :white_check_mark: [active](https://argocd.example.com/applications/app3): Succeeded:\nsuccessfully synced (all tasks run)',
    ].join('\n'),
  })
})
