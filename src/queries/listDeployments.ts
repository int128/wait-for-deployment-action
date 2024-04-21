import * as core from '@actions/core'
import * as github from '@actions/github'
import { ListDeploymentsQuery, ListDeploymentsQueryVariables } from '../generated/graphql.js'

type Octokit = ReturnType<typeof github.getOctokit>

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

export const listDeployments = async (o: Octokit, v: ListDeploymentsQueryVariables): Promise<ListDeploymentsQuery> =>
  logQuery(`listDeployments(${JSON.stringify(v)})`, () => o.graphql(query, v))

const logQuery = async <Q>(group: string, f: () => Promise<Q>): Promise<Q> =>
  core.group(group, async () => {
    const q = await f()
    core.info(JSON.stringify(q, undefined, 2))
    return q
  })
