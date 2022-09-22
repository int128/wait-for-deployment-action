import * as core from '@actions/core'
import * as github from '@actions/github'
import { DeploymentsAtCommitQuery } from './generated/graphql'
import { DeploymentState } from './generated/graphql-types'
import { getDeploymentsAtCommit } from './queries/deployments'

type Inputs = {
  owner: string
  repo: string
  sha: string
  token: string
}

type Outputs = {
  completed: boolean
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  core.info(`Get deployments at ${inputs.owner}/${inputs.repo}@${inputs.sha}`)
  const deployments = await getDeploymentsAtCommit(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
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

  let completed = true
  for (const node of q.repository.object.deployments?.nodes ?? []) {
    if (node == null || node.environment == null || node.state == null || node.latestStatus == null) {
      continue
    }

    if (!(node.state === DeploymentState.Active)) {
      completed = false
    }
  }

  return { completed }
}
