import * as core from '@actions/core'
import * as github from '@actions/github'
import { DeploymentsAtCommitQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'
import { getDeploymentsAtCommit } from './queries/deployments'

type Inputs = {
  sha: string
  token: string
}

type Outputs = {
  completed: boolean
  success: boolean
  summary: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  core.info(`Get deployments at ${inputs.sha}`)
  const deployments = await getDeploymentsAtCommit(octokit, {
    owner: github.context.repo.owner,
    name: github.context.repo.repo,
    expression: inputs.sha,
  })
  core.startGroup('getDeploymentsAtCommit')
  core.info(JSON.stringify(deployments, undefined, 2))
  core.endGroup()

  return aggregate(deployments)
}

export const aggregate = (q: DeploymentsAtCommitQuery): Outputs => {
  if (q.repository == null) {
    throw new Error(`q.repository === ${String(q.repository)}`)
  }
  if (q.repository.object?.__typename !== 'Commit') {
    throw new Error(`q.repository.object.__typename === ${String(q.repository.object?.__typename)}`)
  }

  const outputs = {
    completed: true,
    success: true,
    summary: '',
  }
  const summaryLines = ['Environment | Status | Description | Log', '-------------|--------|-------------|-----']
  for (const node of q.repository.object.deployments?.nodes ?? []) {
    if (node == null || node.environment == null || node.state == null || node.latestStatus == null) {
      continue
    }

    switch (node.state) {
      case DeploymentState.InProgress:
      case DeploymentState.Pending:
      case DeploymentState.Queued:
        outputs.completed = false
        summaryLines.push(
          [node.environment, node.state, node.latestStatus.description, node.latestStatus.logUrl ?? ''].join('|')
        )
        break

      case DeploymentState.Failure:
      case DeploymentState.Error:
        outputs.success = false
        summaryLines.push(
          [node.environment, ':x:', node.latestStatus.description, node.latestStatus.logUrl ?? ''].join('|')
        )
        break

      case DeploymentState.Active:
        summaryLines.push(
          [node.environment, ':white_check_mark:', node.latestStatus.description, node.latestStatus.logUrl ?? ''].join(
            '|'
          )
        )
        break

      default:
        break
    }
  }

  outputs.summary = summaryLines.join('\n')
  return outputs
}
