import * as core from '@actions/core'
import * as github from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run({
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
  core.setOutput('progressing', outputs.progressing)
  core.setOutput('succeeded', outputs.succeeded)
  core.setOutput('failed', outputs.failed)
  core.setOutput('completed', outputs.completed)
  core.setOutput('summary', outputs.summary)
  core.summary.addRaw(outputs.summary)
  await core.summary.write()
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
