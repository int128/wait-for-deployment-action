import * as core from '@actions/core'
import * as github from './github.js'
import { listDeployments } from './queries/listDeployments.js'
import { rollupDeployments, Deployment, Rollup } from './deployments.js'

type Inputs = {
  initialDelaySeconds: number
  periodSeconds: number
  timeoutSeconds: number | null
  owner: string
  repo: string
  deploymentSha: string
}

export const waitForDeployments = async (octokit: github.Octokit, inputs: Inputs): Promise<Rollup> => {
  const startedAt = Date.now()
  core.info(`Waiting for initial delay ${inputs.initialDelaySeconds}s`)
  await sleep(inputs.initialDelaySeconds * 1000)

  for (;;) {
    const deployments = await listDeployments(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.deploymentSha,
    })
    const rollup = rollupDeployments(deployments)
    if (rollup.completed) {
      return rollup
    }
    core.startGroup(`Current deployments`)
    for (const deployment of rollup.deployments) {
      core.info(`- ${deployment.environment}: ${deployment.state}: ${deployment.description ?? ''}`)
    }
    core.endGroup()
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000)
    if (inputs.timeoutSeconds && elapsedSec > inputs.timeoutSeconds) {
      core.info(`Timed out (elapsed ${elapsedSec}s > timeout ${inputs.timeoutSeconds}s)`)
      return rollup
    }
    core.info(`Waiting for period ${inputs.periodSeconds}s`)
    await sleep(inputs.periodSeconds * 1000)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
