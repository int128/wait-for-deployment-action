/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from './graphql-types.js';

/** The possible states in which a deployment can be. */
export type DeploymentState =
  /** The pending deployment was not updated after 30 minutes. */
  | 'ABANDONED'
  /** The deployment is currently active. */
  | 'ACTIVE'
  /** An inactive transient deployment. */
  | 'DESTROYED'
  /** The deployment experienced an error. */
  | 'ERROR'
  /** The deployment has failed. */
  | 'FAILURE'
  /** The deployment is inactive. */
  | 'INACTIVE'
  /** The deployment is in progress. */
  | 'IN_PROGRESS'
  /** The deployment is pending. */
  | 'PENDING'
  /** The deployment has queued */
  | 'QUEUED'
  /** The deployment was successful. */
  | 'SUCCESS'
  /** The deployment is waiting. */
  | 'WAITING';

export type ListDeploymentsQueryVariables = Exact<{
  owner: string;
  name: string;
  expression: string;
}>;


export type ListDeploymentsQuery = { rateLimit: { cost: number } | null, repository: { object:
      | { __typename: 'Blob' }
      | { __typename: 'Commit', deployments: { nodes: Array<{ environment: string | null, task: string | null, state: Types.DeploymentState | null, latestStatus: { description: string | null, logUrl: string | null, environmentUrl: string | null } | null } | null> | null } | null }
      | { __typename: 'Tag' }
      | { __typename: 'Tree' }
     | null } | null };
