import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { ListDeploymentsQuery, ListDeploymentsQueryVariables } from '../generated/graphql.js'

const query = /* GraphQL */ `
  query listDeployments($owner: String!, $name: String!, $expression: String!) {
    rateLimit {
      cost
    }
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        __typename
        ... on Commit {
          deployments(first: 100) {
            nodes {
              environment
              task
              state
              latestStatus {
                description
                logUrl
                environmentUrl
              }
            }
          }
        }
      }
    }
  }
`

export const executeListDeploymentsQuery = async (
  o: Octokit,
  v: ListDeploymentsQueryVariables,
): Promise<ListDeploymentsQuery> => {
  core.info(`Calling ListDeployments(${JSON.stringify(v)})`)
  const q: ListDeploymentsQuery = await o.graphql(query, v)
  assert(q.rateLimit != null)
  core.info(`GitHub API rate limit is ${JSON.stringify(q.rateLimit)}`)
  core.debug(JSON.stringify(q, undefined, 2))
  return q
}
