import { DeploymentsAtCommitQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'

export type Outputs = {
  completed: boolean
  success: boolean
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
    completed: true,
    success: true,
    summary: [],
  }
  for (const node of q.repository.object.deployments?.nodes ?? []) {
    if (node == null || node.environment == null || node.state == null) {
      continue
    }

    switch (node.state) {
      case DeploymentState.InProgress:
      case DeploymentState.Pending:
      case DeploymentState.Queued:
        outputs.completed = false
        outputs.success = false
        outputs.summary.push(
          `- ${node.environment} ([${node.state}](${node.latestStatus?.logUrl ?? ''})): ${
            node.latestStatus?.description ?? ''
          }`
        )
        break

      case DeploymentState.Failure:
      case DeploymentState.Error:
        outputs.success = false
        outputs.summary.push(
          `- :x: ${node.environment} ([${node.state}](${node.latestStatus?.logUrl ?? ''})): ${
            node.latestStatus?.description ?? ''
          }`
        )
        break

      case DeploymentState.Active:
        outputs.summary.push(
          `- :white_check_mark: ${node.environment} ([${node.state}](${node.latestStatus?.logUrl ?? ''})): ${
            node.latestStatus?.description ?? ''
          }`
        )
        break

      default:
        break
    }
  }

  return outputs
}
