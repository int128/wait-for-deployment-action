import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run({
    until: waitUntilOf(core.getInput('until', { required: true })),
    initialDelaySeconds: Number.parseInt(core.getInput('initial-delay-seconds', { required: true })),
    periodSeconds: Number.parseInt(core.getInput('period-seconds', { required: true })),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    deploymentSha: core.getInput('deployment-sha', { required: true }),
    token: core.getInput('token', { required: true }),
  })
  core.info(`Setting outputs: ${JSON.stringify(outputs, undefined, 2)}`)
  core.setOutput('progressing', outputs.progressing)
  core.setOutput('succeeded', outputs.succeeded)
  core.setOutput('failed', outputs.failed)
  core.setOutput('completed', outputs.completed)
  core.setOutput('summary', outputs.summary)
  core.summary.addRaw(outputs.summary)
  await core.summary.write()
}

const waitUntilOf = (s: string): 'completed' | 'succeeded' => {
  if (s === 'completed' || s === 'succeeded') {
    return s
  }
  throw new Error(`until must be either completed or succeeded`)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
