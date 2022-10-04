import { DeploymentsAtCommitQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'

export type Outputs = {
  progressing: boolean
  completed: boolean
  succeeded: boolean
  summary: string[]
}

export const aggregate = (q: DeploymentsAtCommitQuery): Outputs => {
  if (q.repository == null) {
    throw new Error(`q.repository === ${String(q.repository)}`)
  }
  if (q.repository.object?.__typename !== 'Commit') {
    throw new Error(`q.repository.object.__typename === ${String(q.repository.object?.__typename)}`)
  }

  const outputs: Outputs = {
    progressing: false,
    completed: true,
    succeeded: true,
    summary: [],
  }
  for (const node of q.repository.object.deployments?.nodes ?? []) {
    if (node == null || node.environment == null || node.state == null) {
      continue
    }

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
