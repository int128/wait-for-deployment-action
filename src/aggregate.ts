import assert from 'assert'
import { ListDeploymentsQuery } from './generated/graphql.js'
import { DeploymentState } from './generated/graphql-types.js'

export type Outputs = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
  deployments: Deployment[]
}

export type Deployment = {
  environment: string
  state: DeploymentState
  url: string | undefined
  description: string | undefined
}

export const aggregate = (q: ListDeploymentsQuery): Outputs => {
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
    progressing,
    failed,
    completed,
    succeeded,
    deployments,
  }
}
