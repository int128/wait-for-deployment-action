import * as core from '@actions/core'
import * as github from '@actions/github'
import { run } from './run'

const main = async (): Promise<void> => {
  const outputs = await run({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    sha: core.getInput('sha', { required: true }),
    token: core.getInput('token', { required: true }),
  })
  core.setOutput('progressing', outputs.progressing)
  core.setOutput('completed', outputs.completed)
  core.setOutput('succeeded', outputs.succeeded)
  core.setOutput('summary', outputs.summary)

  core.summary.addRaw(outputs.summary)
  await core.summary.write()
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
