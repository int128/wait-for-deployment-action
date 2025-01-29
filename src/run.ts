import * as core from '@actions/core'
import * as github from './github.js'
import { waitForDeployments } from './wait.js'
import { Deployment } from './aggregate.js'
import { DeploymentState } from './generated/graphql-types.js'

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
  const summary = formatSummary(outputs.deployments)

  if (inputs.until === 'succeeded' && outputs.failed) {
    core.setFailed(`Some deployment has failed. See ${inputs.workflowURL} for the summary.`)
    return { ...outputs, summary }
  }

  core.summary.addHeading('wait-for-deployment summary', 2)
  core.summary.addTable([
    [
      { data: 'Environment', header: true },
      { data: 'State', header: true },
      { data: 'Description', header: true },
    ],
    ...outputs.deployments.map((deployment) => [
      toHtmlLink(deployment.environment, deployment.url),
      toDecoratedState(deployment.state),
      deployment.description ?? '',
    ]),
  ])
  await core.summary.write()
  core.info(`You can see the summary at ${inputs.workflowURL}`)
  return { ...outputs, summary }
}

const formatSummary = (deployments: Deployment[]) =>
  deployments
    .map((deployment) => {
      const environmentLink = toMarkdownLink(deployment.environment, deployment.url)
      const decoratedState = toDecoratedState(deployment.state)
      return `- ${environmentLink}: ${decoratedState}: ${deployment.description}`
    })
    .filter<string>((s): s is string => s !== undefined)
    .join('\n')

const toDecoratedState = (state: DeploymentState): string => {
  switch (state) {
    case DeploymentState.Queued:
    case DeploymentState.InProgress:
      return `:rocket: ${state}`
    case DeploymentState.Failure:
    case DeploymentState.Error:
      return `:x: ${state}`
    case DeploymentState.Active:
    case DeploymentState.Success:
      return `:white_check_mark: ${state}`
    default:
      return state
  }
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
