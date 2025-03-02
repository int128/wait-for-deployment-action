import * as core from '@actions/core'
import * as github from './github.js'
import { waitForDeployments } from './wait.js'
import { Deployment, formatDeploymentState, Rollup } from './deployments.js'

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
  const rollup = await waitForDeployments(octokit, inputs)
  const summary = formatSummaryOutput(rollup.deployments)

  if (inputs.until === 'succeeded' && rollup.failed) {
    core.setFailed(`Some deployment has failed. See ${inputs.workflowURL} for the summary.`)
    return { ...rollup, summary }
  }

  await writeDeploymentSummary(rollup)
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

const writeDeploymentSummary = async (rollup: Rollup) => {
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
