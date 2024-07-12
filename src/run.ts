import * as core from '@actions/core'
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
  succeeded: boolean
  failed: boolean
  completed: boolean
  summary: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token)

  if (inputs.waitUntil) {
    core.info(`Waiting for deployments until the status is ${inputs.waitUntil}`)
    const outputs = await waitForDeployments(octokit, inputs)
    if (inputs.waitUntil === 'succeeded' && outputs.failed) {
      core.setFailed(`deployment failed:\n${outputs.summary}`)
      return outputs
    }
    return outputs
  }

  const deployments = await listDeployments(octokit, {
    owner: inputs.owner,
    name: inputs.repo,
    expression: inputs.sha,
  })
  return aggregate(deployments)
}
