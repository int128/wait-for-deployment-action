import assert from 'node:assert'
import * as minimatch from 'minimatch'
import type { ListDeploymentsQuery } from './generated/graphql.js'
import { DeploymentState } from './generated/graphql-types.js'

export type Rollup = {
  conclusion: RollupConclusion
  deployments: Deployment[]
}

export type RollupConclusion = {
  completed: boolean
  succeeded: boolean
  progressing: boolean
  failed: boolean
}

export type Deployment = {
  environment: string
  state: DeploymentState
  url: string | undefined
  description: string | undefined
}

const parseListDeploymentsQuery = (q: ListDeploymentsQuery): Deployment[] => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')
  assert(q.repository.object.deployments != null)
  assert(q.repository.object.deployments.nodes != null)
  return q.repository.object.deployments.nodes.map<Deployment>((node) => {
    assert(node != null)
    assert(node.environment != null)
    assert(node.state != null)
    return {
      environment: node.environment,
      state: node.state,
      url: node.latestStatus?.logUrl ?? undefined,
      description: node.latestStatus?.description?.trim(),
    }
  })
}

export type RollupOptions = {
  filterEnvironments: string[]
  excludeEnvironments: string[]
}

export const rollupDeployments = (query: ListDeploymentsQuery, options: RollupOptions): Rollup => {
  const deployments = filterDeployments(parseListDeploymentsQuery(query), options)
  sortByEnvironment(deployments)
  return {
    conclusion: determineRollupConclusion(deployments),
    deployments,
  }
}

const sortByEnvironment = (deployments: Deployment[]) =>
  deployments.sort((a, b) => a.environment.localeCompare(b.environment))

export const filterDeployments = (deployments: Deployment[], options: RollupOptions): Deployment[] => {
  const excludeEnvironmentMatchers = options.excludeEnvironments.map((pattern) => minimatch.filter(pattern))
  const filterEnvironmentMatchers = options.filterEnvironments.map((pattern) => minimatch.filter(pattern))
  return deployments.filter((deployment) => {
    if (excludeEnvironmentMatchers.length > 0) {
      if (excludeEnvironmentMatchers.some((matcher) => matcher(deployment.environment))) {
        return false
      }
    }
    if (filterEnvironmentMatchers.length > 0) {
      if (!filterEnvironmentMatchers.some((matcher) => matcher(deployment.environment))) {
        return false
      }
    }
    return true
  })
}

export const determineRollupConclusion = (deployments: Deployment[]): RollupConclusion => {
  return {
    completed: deployments.every((deployment) => isDeploymentCompleted(deployment.state)),
    succeeded: deployments.every(
      (deployment) => deployment.state === DeploymentState.Active || deployment.state === DeploymentState.Success,
    ),
    progressing: deployments.some(
      (deployment) => deployment.state === DeploymentState.Queued || deployment.state === DeploymentState.InProgress,
    ),
    failed: deployments.some(
      (deployment) => deployment.state === DeploymentState.Failure || deployment.state === DeploymentState.Error,
    ),
  }
}

export const isDeploymentCompleted = (state: DeploymentState) =>
  state === DeploymentState.Active ||
  state === DeploymentState.Success ||
  state === DeploymentState.Failure ||
  state === DeploymentState.Error

export const formatDeploymentStateMarkdown = (state: DeploymentState): string => {
  switch (state) {
    case DeploymentState.Queued:
    case DeploymentState.InProgress:
      return `:rocket: ${state}`
    case DeploymentState.Failure:
    case DeploymentState.Error:
      return `:x: ${state}`
    case DeploymentState.Active:
    case DeploymentState.Success:
      return `:white_check_mark: ${state}`
    default:
      return state
  }
}

export const formatDeploymentStateEmoji = (state: DeploymentState): string => {
  switch (state) {
    case DeploymentState.Queued:
    case DeploymentState.InProgress:
      return `🚀 ${state}`
    case DeploymentState.Failure:
    case DeploymentState.Error:
      return `❌ ${state}`
    case DeploymentState.Active:
    case DeploymentState.Success:
      return `✅ ${state}`
    default:
      return state
  }
}
