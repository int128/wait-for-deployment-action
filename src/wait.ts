import * as core from '@actions/core'
import * as github from '@actions/github'
import { listDeployments } from './queries/listDeployments.js'
import { aggregate } from './aggregate.js'

type Octokit = ReturnType<typeof github.getOctokit>

type Inputs = {
  waitInitialDelaySeconds: number
  waitPeriodSeconds: number
  owner: string
  repo: string
  sha: string
}

type Outputs = {
  progressing: boolean
  failed: boolean
  completed: boolean
  succeeded: boolean
  summary: string
}

export const waitForDeployments = async (octokit: Octokit, inputs: Inputs): Promise<Outputs> => {
  core.info(`Waiting for initial delay ${inputs.waitInitialDelaySeconds}s`)
  await sleep(inputs.waitInitialDelaySeconds * 1000)

  for (;;) {
    const deployments = await listDeployments(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.sha,
    })
    const outputs = aggregate(deployments)
    if (outputs.completed) {
      return outputs
    }
    core.info(`Waiting for period ${inputs.waitPeriodSeconds}s`)
    await sleep(inputs.waitPeriodSeconds * 1000)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
