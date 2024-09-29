import assert from 'assert'
import { ListDeploymentsQuery } from './generated/graphql.js'
import { DeploymentState } from './generated/graphql-types.js'

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

  const summary = nodes
    .map((node) => {
      assert(node.environment != null)
      assert(node.state != null)
      const description = node.latestStatus?.description?.trim() ?? ''
      const environmentLink = toLink(node.environment, node.latestStatus?.logUrl)
      switch (node.state) {
        case DeploymentState.Queued:
        case DeploymentState.InProgress:
          return `- ${environmentLink}: :rocket: ${node.state}: ${description}`

        case DeploymentState.Failure:
        case DeploymentState.Error:
          return `- ${environmentLink}: :x: ${node.state}: ${description}`

        case DeploymentState.Active:
        case DeploymentState.Success:
          return `- ${environmentLink}: :white_check_mark: ${node.state}: ${description}`

        default:
          return `- ${environmentLink}: ${node.state}: ${description}`
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

const toLink = (s: string, url: string | null | undefined) => {
  if (url == null) {
    return s
  }
  return `[${s}](${url})`
}
