import { GitHub } from '@actions/github/lib/utils'
import { ListDeploymentsQuery, ListDeploymentsQueryVariables } from '../generated/graphql'

type Octokit = InstanceType<typeof GitHub>

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

export const listDeployments = async (
  o: Octokit,
  v: ListDeploymentsQueryVariables
): Promise<ListDeploymentsQuery> => await o.graphql(query, v)
