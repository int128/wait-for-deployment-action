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
  await core.group('query listDeployments', async () => {
    core.info(JSON.stringify(v, undefined, 2))
    const q: ListDeploymentsQuery = await o.graphql(query, v)
    core.info(JSON.stringify(q, undefined, 2))
    return q
  })
