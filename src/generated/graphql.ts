import * as Types from './graphql-types';

export type DeploymentsAtCommitQueryVariables = Types.Exact<{
  owner: Types.Scalars['String'];
  name: Types.Scalars['String'];
  expression: Types.Scalars['String'];
}>;


export type DeploymentsAtCommitQuery = { __typename?: 'Query', rateLimit?: { __typename?: 'RateLimit', cost: number } | null, repository?: { __typename?: 'Repository', object?: { __typename: 'Blob' } | { __typename: 'Commit', deployments?: { __typename?: 'DeploymentConnection', nodes?: Array<{ __typename?: 'Deployment', environment?: string | null, state?: Types.DeploymentState | null, latestStatus?: { __typename?: 'DeploymentStatus', description?: string | null, logUrl?: string | null, environmentUrl?: string | null } | null } | null> | null } | null } | { __typename: 'Tag' } | { __typename: 'Tree' } | null } | null };
