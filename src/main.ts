import * as core from '@actions/core'
import * as github from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run({
    filterEnvironments: core.getMultilineInput('filter-environments'),
    excludeEnvironments: core.getMultilineInput('exclude-environments'),
    until: parseUntil(core.getInput('until', { required: true })),
    initialDelaySeconds: Number.parseInt(core.getInput('initial-delay-seconds', { required: true })),
    periodSeconds: Number.parseInt(core.getInput('period-seconds', { required: true })),
    timeoutSeconds: Number.parseInt(core.getInput('timeout-seconds')) || null,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    deploymentSha: core.getInput('deployment-sha', { required: true }),
    token: core.getInput('token', { required: true }),
    workflowURL: `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`,
  })

  core.setOutput('progressing', outputs.conclusion.progressing)
  core.setOutput('succeeded', outputs.conclusion.succeeded)
  core.setOutput('failed', outputs.conclusion.failed)
  core.setOutput('completed', outputs.conclusion.completed)
  core.setOutput('summary', outputs.summary)

  core.startGroup('outputs')
  core.info(JSON.stringify(outputs.conclusion, undefined, 2))
  core.endGroup()
  core.startGroup('outputs.summary')
  core.info(outputs.summary)
  core.endGroup()
}

const parseUntil = (s: string): 'completed' | 'succeeded' => {
  if (s === 'completed' || s === 'succeeded') {
    return s
  }
  throw new Error(`until must be either completed or succeeded`)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
