import assert from 'assert'
import { ListDeploymentsQuery } from './generated/graphql.js'
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

export const rollupDeployments = (q: ListDeploymentsQuery): Rollup => {
  const deployments = parseListDeploymentsQuery(q)

  const conclusion: RollupConclusion = {
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

  return {
    conclusion,
    deployments,
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
