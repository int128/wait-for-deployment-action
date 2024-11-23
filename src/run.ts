import * as core from '@actions/core'
import * as github from './github.js'
import { waitForDeployments } from './wait.js'

type Inputs = {
  until: 'completed' | 'succeeded'
  initialDelaySeconds: number
  periodSeconds: number
  timeoutSeconds: number | null
  owner: string
  repo: string
  deploymentSha: string
  token: string
  workflowURL: string
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
  core.info(`----`)
  core.info(`succeeded: ${outputs.succeeded}`)
  core.info(`failed: ${outputs.failed}`)
  core.info(`completed: ${outputs.completed}`)
  core.info(`progressing: ${outputs.progressing}`)
  core.info(`----`)
  core.info(outputs.summary)
  core.info(`----`)
  if (inputs.until === 'succeeded' && outputs.failed) {
    core.setFailed(`Some deployment has failed. See ${inputs.workflowURL} for the summary.`)
    return outputs
  }
  core.info(`You can see the summary at ${inputs.workflowURL}`)
  return outputs
}
