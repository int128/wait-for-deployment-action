import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { listDeployments } from './queries/listDeployments'
import { aggregate } from './aggregate'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  waitUntil: 'completed' | 'succeeded' | undefined
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
  const { data: comment } = await octokit.rest.issues.createComment({
    owner: inputs.owner,
    repo: inputs.repo,
    issue_number: github.context.issue.number, // TODO
    body: `Deploying the commit ${inputs.sha}`,
  })

  core.info(`Waiting for initial delay ${inputs.waitInitialDelaySeconds}s`)
  await sleep(inputs.waitInitialDelaySeconds * 1000)

  core.info(`Waiting for deployments until the status is ${inputs.waitUntil}`)
  for (;;) {
    const deployments = await listDeployments(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.sha,
    })
    const outputs = aggregate(deployments)

    await octokit.rest.issues.updateComment({
      owner: inputs.owner,
      repo: inputs.repo,
      comment_id: comment.id,
      body: `## Deployment summary\n${outputs.summary}`,
    })

    if (inputs.waitUntil === 'succeeded') {
      if (outputs.succeeded) {
        return outputs
      }
      if (outputs.failed) {
        throw new Error(`deployment was failed:\n${outputs.summary}`)
      }
    }
    if (inputs.waitUntil === 'completed' && outputs.completed) {
      return outputs
    }
    core.info(`Waiting for period ${inputs.waitPeriodSeconds}s`)
    await sleep(inputs.waitPeriodSeconds * 1000)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
