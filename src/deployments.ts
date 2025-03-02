import assert from 'assert'
import { ListDeploymentsQuery } from './generated/graphql.js'
import { DeploymentState } from './generated/graphql-types.js'

export type Rollup = {
  conclusion: RollupConclusion
  deployments: Deployment[]
}

export type RollupConclusion = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
}

export type Deployment = {
  environment: string
  state: DeploymentState
  url: string | undefined
  description: string | undefined
}

export const rollupDeployments = (q: ListDeploymentsQuery): Rollup => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')
  assert(q.repository.object.deployments != null)
  assert(q.repository.object.deployments.nodes != null)

  const nodes = q.repository.object.deployments.nodes.map((node) => {
    assert(node != null)
    return node
  })

  const progressing = nodes.some(
    (node) => node.state === DeploymentState.Queued || node.state === DeploymentState.InProgress,
  )
  const succeeded = nodes.every(
    (node) => node.state === DeploymentState.Active || node.state === DeploymentState.Success,
  )
  const failed = nodes.some((node) => node.state === DeploymentState.Failure || node.state === DeploymentState.Error)
  const completed = nodes.every(
    (node) =>
      node.state === DeploymentState.Active ||
      node.state === DeploymentState.Success ||
      node.state === DeploymentState.Failure ||
      node.state === DeploymentState.Error,
  )

  const deployments = nodes.map<Deployment>((node) => {
    assert(node.environment != null)
    assert(node.state != null)
    const description = node.latestStatus?.description?.trim()
    return {
      environment: node.environment,
      state: node.state,
      url: node.latestStatus?.logUrl ?? undefined,
      description: description,
    }
  })

  return {
    conclusion: {
      progressing,
      failed,
      completed,
      succeeded,
    },
    deployments,
  }
}

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
