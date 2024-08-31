import * as core from '@actions/core'
import * as github from '@actions/github'
import { waitForDeployments } from './wait.js'

type Inputs = {
  until: 'completed' | 'succeeded'
  initialDelaySeconds: number
  periodSeconds: number
  owner: string
  repo: string
  deploymentSha: string
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

  core.info(`Waiting for deployments until the status is ${inputs.until}`)
  const outputs = await waitForDeployments(octokit, inputs)
  if (inputs.until === 'succeeded' && outputs.failed) {
    core.setFailed(`Some deployment failed:\n${outputs.summary}`)
    return outputs
  }
  return outputs
}
