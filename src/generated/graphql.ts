import * as Types from './graphql-types.js';

export type ListDeploymentsQueryVariables = Types.Exact<{
  owner: Types.Scalars['String']['input'];
  name: Types.Scalars['String']['input'];
  expression: Types.Scalars['String']['input'];
}>;


export type ListDeploymentsQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', deployments?: { __typename?: 'DeploymentConnection', nodes?: Array<{ __typename?: 'Deployment', environment?: string | null, state?: Types.DeploymentState | null, latestStatus?: { __typename?: 'DeploymentStatus', description?: string | null, logUrl?: string | null, environmentUrl?: string | null } | null } | null> | null } | null } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
