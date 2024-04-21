import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run({
    waitUntil: waitUntilOf(core.getInput('wait-until')),
    waitInitialDelaySeconds: Number.parseInt(core.getInput('wait-initial-delay-seconds', { required: true })),
    waitPeriodSeconds: Number.parseInt(core.getInput('wait-period-seconds', { required: true })),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    sha: core.getInput('sha', { required: true }),
    token: core.getInput('token', { required: true }),
  })
  core.info(`Setting outputs: ${JSON.stringify(outputs, undefined, 2)}`)
  core.setOutput('progressing', outputs.progressing)
  core.setOutput('failed', outputs.failed)
  core.setOutput('completed', outputs.completed)
  core.setOutput('succeeded', outputs.succeeded)
  core.setOutput('summary', outputs.summary)
  core.summary.addRaw(outputs.summary)
  await core.summary.write()
}

const waitUntilOf = (s: string): 'completed' | 'succeeded' | undefined => {
  if (s === '') {
    return
  }
  if (s === 'completed' || s === 'succeeded') {
    return s
  }
  throw new Error(`wait-until must be either completed or succeeded`)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
