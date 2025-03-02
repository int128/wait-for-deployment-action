import * as core from '@actions/core'
import * as github from './github.js'
import { getListDeploymentsQuery } from './queries/listDeployments.js'
import { Deployment, formatDeploymentState, Rollup, rollupDeployments } from './deployments.js'

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
  core.info(`Waiting for deployments until the status is ${inputs.until}`)
  const rollup = await poll(inputs)
  const summary = formatSummaryOutput(rollup.deployments)

  if (inputs.until === 'succeeded' && rollup.failed) {
    core.setFailed(`Some deployment has failed. See ${inputs.workflowURL} for the summary.`)
    return { ...rollup, summary }
  }

  await writeDeploymentsSummary(rollup)
  core.info(`You can see the summary at ${inputs.workflowURL}`)
  return { ...rollup, summary }
}

const formatSummaryOutput = (deployments: Deployment[]) =>
  deployments
    .map((deployment) => {
      const environmentLink = toMarkdownLink(deployment.environment, deployment.url)
      const decoratedState = formatDeploymentState(deployment.state)
      return `- ${environmentLink}: ${decoratedState}: ${deployment.description ?? ''}`
    })
    .join('\n')

const poll = async (inputs: Inputs): Promise<Rollup> => {
  const octokit = github.getOctokit(inputs.token)
  const startedAt = Date.now()
  core.info(`Waiting for initial delay ${inputs.initialDelaySeconds}s`)
  await sleep(inputs.initialDelaySeconds * 1000)

  for (;;) {
    core.startGroup(`GraphQL request`)
    const deployments = await getListDeploymentsQuery(octokit, {
      owner: inputs.owner,
      name: inputs.repo,
      expression: inputs.deploymentSha,
    })
    core.endGroup()

    const rollup = rollupDeployments(deployments)
    if (rollup.completed) {
      return rollup
    }

    core.startGroup(`Current deployments`)
    writeDeploymentsLog(rollup)
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

const writeDeploymentsLog = (rollup: Rollup) => {
  for (const deployment of rollup.deployments) {
    core.info(`- ${deployment.environment}: ${deployment.state}: ${deployment.description ?? ''}`)
  }
}

const writeDeploymentsSummary = async (rollup: Rollup) => {
  core.summary.addHeading('wait-for-deployment summary', 2)
  core.summary.addTable([
    [
      { data: 'Environment', header: true },
      { data: 'State', header: true },
      { data: 'Description', header: true },
    ],
    ...rollup.deployments.map((deployment) => [
      toHtmlLink(deployment.environment, deployment.url),
      formatDeploymentState(deployment.state),
      deployment.description ?? '',
    ]),
  ])
  await core.summary.write()
}

const toMarkdownLink = (s: string, url: string | null | undefined) => {
  if (url == null) {
    return s
  }
  return `[${s}](${url})`
}

const toHtmlLink = (s: string, url: string | null | undefined) => {
  if (url == null) {
    return s
  }
  return `<a href="${url}">${s}</a>`
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
