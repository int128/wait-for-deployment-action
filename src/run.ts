import * as core from '@actions/core'
import * as github from '@actions/github'
import { aggregate } from './aggregate'
import { listDeployments } from './queries/listDeployments'
import { GitHub } from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

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
  completed: boolean
  succeeded: boolean
  summary: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  if (inputs.waitUntil) {
    return await waitForDeployments(inputs)
  }

  const octokit = github.getOctokit(inputs.token)
  return await getStatus(octokit, inputs)
}

const waitForDeployments = async (inputs: Inputs): Promise<Outputs> => {
  core.info(`Waiting for initial delay ${inputs.waitInitialDelaySeconds}s`)
  await sleep(inputs.waitInitialDelaySeconds * 1000)
  core.info(`Waiting for deployments until the status is ${inputs.waitUntil}`)
  const octokit = github.getOctokit(inputs.token)
  for (;;) {
    const outputs = await getStatus(octokit, inputs)
    if (inputs.waitUntil === 'succeeded' && outputs.succeeded) {
      return outputs
    }
    if (inputs.waitUntil === 'completed' && outputs.completed) {
      return outputs
    }
    core.info(`Waiting for period ${inputs.waitPeriodSeconds}s`)
    await sleep(inputs.waitPeriodSeconds * 1000)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getStatus = async (octokit: Octokit, inputs: Inputs): Promise<Outputs> => {
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
