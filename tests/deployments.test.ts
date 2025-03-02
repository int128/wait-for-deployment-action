import { rollupDeployments, Rollup } from '../src/deployments.js'
import { DeploymentState } from '../src/generated/graphql-types.js'

test('invalid query', () => {
  expect(() => rollupDeployments({})).toThrow()
})

test('all pending', () => {
  expect(
    rollupDeployments({
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
  ).toStrictEqual<Rollup>({
    conclusion: {
      progressing: false,
      failed: false,
      completed: false,
      succeeded: false,
    },
    deployments: [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
    ],
  })
})

test('progressing', () => {
  expect(
    rollupDeployments({
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
  ).toStrictEqual<Rollup>({
    conclusion: {
      progressing: true,
      failed: false,
      completed: false,
      succeeded: false,
    },
    deployments: [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.InProgress,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Queued,
        url: undefined,
        description: undefined,
      },
    ],
  })
})

test('any failed', () => {
  expect(
    rollupDeployments({
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
  ).toStrictEqual<Rollup>({
    conclusion: {
      progressing: true,
      failed: true,
      completed: false,
      succeeded: false,
    },
    deployments: [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.InProgress,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Failure,
        url: undefined,
        description: undefined,
      },
    ],
  })
})

test('all active', () => {
  expect(
    rollupDeployments({
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
  ).toStrictEqual<Rollup>({
    conclusion: {
      progressing: false,
      failed: false,
      completed: true,
      succeeded: true,
    },
    deployments: [
      {
        environment: 'pr-727/app1',
        state: DeploymentState.Active,
        url: 'https://argocd.example.com/applications/app1',
        description: 'Succeeded:\nsuccessfully synced (all tasks run)',
      },
      {
        environment: 'pr-727/app3',
        state: DeploymentState.Active,
        url: 'https://argocd.example.com/applications/app3',
        description: 'Succeeded:\nsuccessfully synced (all tasks run)',
      },
    ],
  })
})
