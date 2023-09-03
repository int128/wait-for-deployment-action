import assert from 'assert'
import { DeploymentsAtCommitQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'

export type Outputs = {
  progressing: boolean
  completed: boolean
  succeeded: boolean
  summary: string[]
}

export const aggregate = (q: DeploymentsAtCommitQuery): Outputs => {
  assert(q.repository != null)
  assert(q.repository.object != null)
  assert.strictEqual(q.repository.object.__typename, 'Commit')
  assert(q.repository.object.deployments != null)
  assert(q.repository.object.deployments.nodes != null)

  const outputs: Outputs = {
    progressing: false,
    completed: true,
    succeeded: true,
    summary: [],
  }
  for (const node of q.repository.object.deployments.nodes) {
    assert(node != null)
    assert(node.environment != null)
    assert(node.state != null)

    const description = node.latestStatus?.description?.trim() ?? ''
    const stateLink = toLink(node.state, node.latestStatus?.logUrl)
    switch (node.state) {
      case DeploymentState.Pending:
        outputs.completed = false
        outputs.succeeded = false
        outputs.summary.push(`- ${node.environment}: ${stateLink}: ${description}`)
        break

      case DeploymentState.Queued:
      case DeploymentState.InProgress:
        outputs.progressing = true
        outputs.completed = false
        outputs.succeeded = false
        outputs.summary.push(`- ${node.environment}: :rocket: ${stateLink}: ${description}`)
        break

      case DeploymentState.Failure:
      case DeploymentState.Error:
        outputs.succeeded = false
        outputs.summary.push(`- ${node.environment}: :x: ${stateLink}: ${description}`)
        break

      case DeploymentState.Active:
        outputs.summary.push(`- ${node.environment}: :white_check_mark: ${stateLink}: ${description}`)
        break

      default:
        break
    }
  }

  return outputs
}

const toLink = (state: DeploymentState, url: string | null | undefined) => {
  const stateString = state.toLowerCase().replace('_', ' ')
  if (url == null) {
    return stateString
  }
  return `[${stateString}](${url})`
}
