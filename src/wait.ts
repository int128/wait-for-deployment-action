import * as core from '@actions/core'
import * as github from '@actions/github'
import { listDeployments } from './queries/listDeployments.js'
import { aggregate } from './aggregate.js'

type Octokit = ReturnType<typeof github.getOctokit>

type Inputs = {
  initialDelaySeconds: number
  periodSeconds: number
  timeoutSeconds: number | null
  owner: string
  repo: string
  deploymentSha: string
}

type Outputs = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
  summary: string
}

export const waitForDeployments = async (octokit: Octokit, inputs: Inputs): Promise<Outputs> => {
  const startedAt = Date.now()
  core.info(`Waiting for initial delay ${inputs.initialDelaySeconds}s`)
  await sleep(inputs.initialDelaySeconds * 1000)

  for (;;) {
    const deployments = await listDeployments(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.deploymentSha,
    })
    const outputs = aggregate(deployments)
    if (outputs.completed) {
      return outputs
    }
    core.startGroup(`Current deployments`)
    core.info(outputs.summary)
    core.endGroup()
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000)
    if (inputs.timeoutSeconds && elapsedSec > inputs.timeoutSeconds) {
      core.info(`Timeout (elapsed ${elapsedSec}s > timeout ${inputs.timeoutSeconds}s)`)
      return outputs
    }
    core.info(`Waiting for period ${inputs.periodSeconds}s`)
    await sleep(inputs.periodSeconds * 1000)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
