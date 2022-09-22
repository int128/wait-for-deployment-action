import * as core from '@actions/core'
import * as github from '@actions/github'
import { aggregate } from './aggregate'
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

  const outputs = aggregate(deployments)
  return {
    ...outputs,
    summary: outputs.summary.join('\n'),
  }
}
