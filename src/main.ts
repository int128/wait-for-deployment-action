import assert from 'node:assert'
import * as core from '@actions/core'
import * as github from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run(
    {
      filterEnvironments: core.getMultilineInput('filter-environments'),
      excludeEnvironments: core.getMultilineInput('exclude-environments'),
      until: parseUntil(core.getInput('until', { required: true })),
      initialDelaySeconds: getRequiredIntInput('initial-delay-seconds'),
      periodSeconds: getRequiredIntInput('period-seconds'),
      timeoutSeconds: getOptionalIntInput('timeout-seconds'),
      deploymentSha: core.getInput('deployment-sha', { required: true }),
      summaryMarkdownFlavor: parseSummaryMarkdownFlavor(core.getInput('summary-markdown-flavor', { required: true })),
    },
    github.getOctokit(),
    await github.getContext(),
  )

  core.setOutput('progressing', outputs.conclusion.progressing)
  core.setOutput('succeeded', outputs.conclusion.succeeded)
  core.setOutput('failed', outputs.conclusion.failed)
  core.setOutput('completed', outputs.conclusion.completed)
  core.setOutput('total-count', outputs.totalCount)
  core.setOutput('summary', outputs.summary)
  core.setOutput('json', outputs.json)

  core.startGroup('outputs')
  core.info(`progressing: ${outputs.conclusion.progressing}`)
  core.info(`succeeded: ${outputs.conclusion.succeeded}`)
  core.info(`failed: ${outputs.conclusion.failed}`)
  core.info(`completed: ${outputs.conclusion.completed}`)
  core.info(`total-count: ${outputs.totalCount}`)
  core.endGroup()
  core.startGroup('outputs.summary')
  core.info(outputs.summary)
  core.endGroup()
  core.startGroup('outputs.json')
  core.info(JSON.stringify(outputs.json, undefined, 2))
  core.endGroup()
}

const getRequiredIntInput = (name: string): number => {
  const n = Number.parseInt(core.getInput(name, { required: true }), 10)
  assert(Number.isSafeInteger(n), `${name} must be an integer`)
  return n
}

const getOptionalIntInput = (name: string): number | null => {
  const v = core.getInput(name)
  if (v === '') {
    return null
  }
  const n = Number.parseInt(v, 10)
  assert(Number.isSafeInteger(n), `${name} must be an integer`)
  return n
}

const parseUntil = (s: string): 'completed' | 'succeeded' => {
  if (s === 'completed' || s === 'succeeded') {
    return s
  }
  throw new Error(`until must be either completed or succeeded`)
}

const parseSummaryMarkdownFlavor = (s: string): 'github' | 'slack' => {
  if (s === 'github' || s === 'slack') {
    return s
  }
  throw new Error(`summary-markdown-flavor must be either github or slack`)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
