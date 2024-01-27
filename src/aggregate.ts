import assert from 'assert'
import { ListDeploymentsQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'

export type Outputs = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
  summary: string
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
  const failed = nodes.some((node) => node.state === DeploymentState.Failure || node.state === DeploymentState.Error)
  const completed = !nodes.some(
    (node) =>
      node.state === DeploymentState.Pending ||
      node.state === DeploymentState.Waiting ||
      node.state === DeploymentState.Queued ||
      node.state === DeploymentState.InProgress,
  )
  const succeeded = !nodes.some(
    (node) =>
      node.state === DeploymentState.Pending ||
      node.state === DeploymentState.Waiting ||
      node.state === DeploymentState.Queued ||
      node.state === DeploymentState.InProgress ||
      node.state === DeploymentState.Failure ||
      node.state === DeploymentState.Error,
  )

  const summary = nodes
    .map((node) => {
      assert(node.environment != null)
      assert(node.state != null)
      const description = node.latestStatus?.description?.trim() ?? ''
      const stateLink = toLink(node.state, node.latestStatus?.logUrl)
      switch (node.state) {
        case DeploymentState.Pending:
          return `- ${node.environment}: ${stateLink}: ${description}`

        case DeploymentState.Queued:
        case DeploymentState.InProgress:
          return `- ${node.environment}: :rocket: ${stateLink}: ${description}`

        case DeploymentState.Failure:
        case DeploymentState.Error:
          return `- ${node.environment}: :x: ${stateLink}: ${description}`

        case DeploymentState.Active:
          return `- ${node.environment}: :white_check_mark: ${stateLink}: ${description}`
      }
    })
    .filter<string>((s): s is string => s !== undefined)

  return {
    progressing,
    failed,
    completed,
    succeeded,
    summary: summary.join('\n'),
  }
}

const toLink = (state: DeploymentState, url: string | null | undefined) => {
  const stateString = state.toLowerCase().replace('_', ' ')
  if (url == null) {
    return stateString
  }
  return `[${stateString}](${url})`
}
