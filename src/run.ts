import * as core from '@actions/core'
import * as github from '@actions/github'
import { aggregate } from './aggregate'
import { listDeployments } from './queries/listDeployments'

type Inputs = {
  owner: string
  repo: string
  sha: string
  token: string
}

type Outputs = {
  progressing: boolean
  completed: boolean
  succeeded: boolean
  summary: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  core.startGroup(`listDeployments(sha: ${inputs.sha})`)
  const deployments = await listDeployments(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.sha,
  })
  core.info(JSON.stringify(deployments, undefined, 2))
  core.endGroup()

  const outputs = aggregate(deployments)
  core.info(`outputs = ${JSON.stringify(outputs, undefined, 2)}`)
  const summary = outputs.summary.join('\n')
  core.summary.addRaw(summary)
  return {
    ...outputs,
    summary,
  }
}
