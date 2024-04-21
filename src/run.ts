import * as github from '@actions/github'
import { aggregate } from './aggregate.js'
import { listDeployments } from './queries/listDeployments.js'
import { waitForDeployments } from './wait.js'

type Inputs = {
  waitUntil: 'completed' | 'succeeded' | undefined
  waitInitialDelaySeconds: number
  waitPeriodSeconds: number
  owner: string
  repo: string
  sha: string
  token: string
}

type Outputs = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
  summary: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  if (inputs.waitUntil) {
    return await waitForDeployments(octokit, inputs)
  }

  const deployments = await listDeployments(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.sha,
  })
  return aggregate(deployments)
}
