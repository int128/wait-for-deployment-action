import { GitHub } from '@actions/github/lib/utils'
import { DeploymentsAtCommitQuery, DeploymentsAtCommitQueryVariables } from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

const query = /* GraphQL */ `
  query deploymentsAtCommit($owner: String!, $name: String!, $expression: String!) {
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

export const getDeploymentsAtCommit = async (
  o: Octokit,
  v: DeploymentsAtCommitQueryVariables
): Promise<DeploymentsAtCommitQuery> => await o.graphql(query, v)
