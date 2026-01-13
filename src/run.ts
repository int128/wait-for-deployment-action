import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import {
  type Deployment,
  formatDeploymentStateEmoji,
  formatDeploymentStateMarkdown,
  isDeploymentCompleted,
  type Rollup,
  type RollupConclusion,
  rollupDeployments,
} from './deployments.js'
import type * as github from './github.js'
import { getListDeploymentsQuery } from './queries/listDeployments.js'
import { sleep, startTimer } from './timer.js'

type SummaryMarkdownFlavor = 'github' | 'slack'

type Inputs = {
  filterEnvironments: string[]
  excludeEnvironments: string[]
  until: 'completed' | 'succeeded'
  initialDelaySeconds: number
  periodSeconds: number
  timeoutSeconds: number | null
  deploymentSha: string
  summaryMarkdownFlavor: SummaryMarkdownFlavor
}

type Outputs = {
  conclusion: RollupConclusion
  totalCount: number
  summary: string
  json: {
    deployments: Deployment[]
  }
}

export const run = async (inputs: Inputs, octokit: Octokit, context: github.Context): Promise<Outputs> => {
  core.info(`Target commit: ${inputs.deploymentSha}`)
  core.info(`Waiting until the status is ${inputs.until}`)
  const rollup = await poll(inputs, octokit, context)
  core.info(`----`)
  writeDeploymentsLog(rollup)
  core.info(`----`)
  await writeDeploymentsSummary(rollup)
  const workflowURL = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
  core.info(`You can see the summary at ${workflowURL}`)

  if (inputs.until === 'succeeded' && rollup.conclusion.failed) {
    core.setFailed(`Some deployment has failed. See ${workflowURL} for the summary.`)
  }
  const summary = formatSummaryOutput(rollup, inputs.summaryMarkdownFlavor)
  return {
    conclusion: rollup.conclusion,
    totalCount: rollup.deployments.length,
    summary,
    json: {
      deployments: rollup.deployments,
    },
  }
}

const poll = async (inputs: Inputs, octokit: Octokit, context: github.Context): Promise<Rollup> => {
  const timer = startTimer()
  core.info(`Waiting for initial delay ${inputs.initialDelaySeconds}s`)
  await sleep(inputs.initialDelaySeconds * 1000)

  for (;;) {
    core.startGroup(`GraphQL request`)
    const deployments = await getListDeploymentsQuery(octokit, {
      owner: context.repo.owner,
      name: context.repo.repo,
      expression: inputs.deploymentSha,
    })
    core.endGroup()

    const rollup = rollupDeployments(deployments, {
      filterEnvironments: inputs.filterEnvironments,
      excludeEnvironments: inputs.excludeEnvironments,
    })
    if (rollup.conclusion.completed) {
      return rollup
    }

    const completedCount = rollup.deployments.filter((deployment) => isDeploymentCompleted(deployment.state)).length
    core.startGroup(`Current deployments: ${completedCount} / ${rollup.deployments.length} completed`)
    writeDeploymentsLog(rollup)
    core.endGroup()

    const elapsedSec = timer.elapsedSeconds()
    if (inputs.timeoutSeconds !== null && elapsedSec > inputs.timeoutSeconds) {
      core.info(`Timed out (elapsed ${elapsedSec}s > timeout ${inputs.timeoutSeconds}s)`)
      return rollup
    }
    core.info(`Waiting for ${inputs.periodSeconds}s`)
    await sleep(inputs.periodSeconds * 1000)
  }
}

const writeDeploymentsLog = (rollup: Rollup) => {
  for (const deployment of rollup.deployments) {
    const columns = [deployment.environment, formatDeploymentStateEmoji(deployment.state)]
    if (deployment.description) {
      columns.push(deployment.description)
    }
    core.info(columns.join(': '))
  }
}

const writeDeploymentsSummary = async (rollup: Rollup) => {
  core.summary.addHeading('wait-for-deployment summary', 2)
  const conclusions = []
  if (rollup.conclusion.completed) {
    conclusions.push('completed')
  }
  if (rollup.conclusion.succeeded) {
    conclusions.push('succeeded')
  }
  if (rollup.conclusion.progressing) {
    conclusions.push('progressing')
  }
  if (rollup.conclusion.failed) {
    conclusions.push('failed')
  }
  core.summary.addRaw(`<p>Rollup conclusion: ${conclusions.join(', ')}</p>`)
  core.summary.addTable([
    [
      { data: 'Environment', header: true },
      { data: 'State', header: true },
      { data: 'Description', header: true },
    ],
    ...rollup.deployments.map((deployment) => [
      toHtmlLink(deployment.environment, deployment.url),
      formatDeploymentStateMarkdown(deployment.state),
      deployment.description ?? '',
    ]),
  ])
  await core.summary.write()
}

const formatSummaryOutput = (rollup: Rollup, flavor: SummaryMarkdownFlavor) =>
  rollup.deployments
    .map((deployment) => {
      const columns = [
        toMarkdownLink(deployment.environment, deployment.url, flavor),
        formatDeploymentStateMarkdown(deployment.state),
      ]
      if (deployment.description) {
        columns.push(deployment.description)
      }
      return `- ${columns.join(': ')}`
    })
    .join('\n')

const toMarkdownLink = (s: string, url: string | null | undefined, flavor: SummaryMarkdownFlavor) => {
  if (url == null) {
    return s
  }
  if (flavor === 'slack') {
    return `<${url}|${s}>`
  }
  return `[${s}](${url})`
}

const toHtmlLink = (s: string, url: string | null | undefined) => {
  if (url == null) {
    return s
  }
  return `<a href="${url}">${s}</a>`
}
