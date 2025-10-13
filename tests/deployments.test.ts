import { describe, expect, it } from 'vitest'
import { determineRollupConclusion, filterDeployments, type Rollup, rollupDeployments } from '../src/deployments.js'
import type { ListDeploymentsQuery } from '../src/generated/graphql.js'
import { DeploymentState } from '../src/generated/graphql-types.js'

describe('rollupDeployments', () => {
  it('throws an error if an invalid query is given', () => {
    expect(() =>
      rollupDeployments(
        {},
        {
          excludeEnvironments: [],
          filterEnvironments: [],
        },
      ),
    ).toThrow()
  })

  it('returns the deployments', () => {
    const query: ListDeploymentsQuery = {
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
                environment: 'pr-2/app2',
                state: DeploymentState.Pending,
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
      rateLimit: {
        cost: 1,
      },
    }
    expect(
      rollupDeployments(query, {
        excludeEnvironments: [],
        filterEnvironments: [],
      }),
    ).toStrictEqual<Rollup>({
      conclusion: {
        completed: false,
        succeeded: false,
        progressing: true,
        failed: false,
      },
      deployments: [
        {
          environment: 'pr-2/app2',
          state: DeploymentState.Pending,
          url: undefined,
          description: undefined,
        },
        {
          environment: 'pr-2/app3',
          state: DeploymentState.Queued,
          url: undefined,
          description: undefined,
        },
        {
          environment: 'pr-727/app1',
          state: DeploymentState.Active,
          url: 'https://argocd.example.com/applications/app1',
          description: 'Succeeded:\nsuccessfully synced (all tasks run)',
        },
      ],
    })
  })
})

describe('filterDeployments', () => {
  const deployments = [
    {
      environment: 'pr-2/app1',
      state: DeploymentState.Active,
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
      state: DeploymentState.InProgress,
      url: undefined,
      description: undefined,
    },
  ]

  it('returns the filtered deployments', () => {
    const options = {
      excludeEnvironments: ['*/app1'],
      filterEnvironments: ['pr-2/*'],
    }
    expect(filterDeployments(deployments, options)).toStrictEqual([
      {
        environment: 'pr-2/app2',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.InProgress,
        url: undefined,
        description: undefined,
      },
    ])
  })
})

describe('determineRollupConclusion', () => {
  it('returns nothing if all deployments are pending', () => {
    const deployments = [
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
    ]
    expect(determineRollupConclusion(deployments)).toStrictEqual({
      completed: false,
      succeeded: false,
      progressing: false,
      failed: false,
    })
  })

  it('returns progressing if any deployment is in progress', () => {
    const deployments = [
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
    ]
    expect(determineRollupConclusion(deployments)).toStrictEqual({
      completed: false,
      succeeded: false,
      progressing: true,
      failed: false,
    })
  })

  it('returns failed if any deployment has failed', () => {
    const deployments = [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Pending,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.Failure,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Queued,
        url: undefined,
        description: undefined,
      },
    ]
    expect(determineRollupConclusion(deployments)).toStrictEqual({
      completed: false,
      succeeded: false,
      progressing: true,
      failed: true,
    })
  })

  it('returns completed even if any deployment has failed', () => {
    const deployments = [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Success,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.Failure,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Success,
        url: undefined,
        description: undefined,
      },
    ]
    expect(determineRollupConclusion(deployments)).toStrictEqual({
      completed: true,
      succeeded: false,
      progressing: false,
      failed: true,
    })
  })

  it('returns succeeded if all deployments have succeeded', () => {
    const deployments = [
      {
        environment: 'pr-2/app1',
        state: DeploymentState.Success,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app2',
        state: DeploymentState.Success,
        url: undefined,
        description: undefined,
      },
      {
        environment: 'pr-2/app3',
        state: DeploymentState.Success,
        url: undefined,
        description: undefined,
      },
    ]
    expect(determineRollupConclusion(deployments)).toStrictEqual({
      completed: true,
      succeeded: true,
      progressing: false,
      failed: false,
    })
  })
})
