# wait-for-deployment-action [![ts](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml)

This is an action to wait for the GitHub Deployment.

## Getting Started

To wait until all deployments are succeeded,

```yaml
name: wait-for-deployment-succeeded

on:
  pull_request:

jobs:
  notify:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: int128/wait-for-deployment-action@v1
        id: deployment
        with:
          until: succeeded
          deployment-sha: ${{ github.event.pull_request.head.sha || github.sha }}
      - uses: int128/comment-action@v1
        with:
          post: |
            ## Deploy succeeded
            ${{ steps.deployment.outputs.summary }}
```

## Specification

This action determines the status as follows:

- If a deployment status is `queued` or `in_progress`, this action considers it as progressing.
- If a deployment status is `active` or `success`, this action considers it as succeeded and completed.
- If a deployment status is `failure` or `error`, this action considers it as failed and completed.

### Inputs

| Name                    | Default        | Description                       |
| ----------------------- | -------------- | --------------------------------- |
| `until`                 | (required)     | Either `completed` or `succeeded` |
| `initial-delay-seconds` | 10             | Initial delay before polling      |
| `period-seconds`        | 15             | Polling period                    |
| `timeout-seconds`       | -              | If set, poll until the timeout    |
| `deployment-sha`        | (required)     | Find deployments by commit        |
| `token`                 | `github.token` | GitHub token                      |

If `until` is set to `succeeded`,

- It exits successfully when **all** deployments are succeeded
- It exits with an error when **any** deployment is failed

If `until` is set to `completed`, it exits when all deployments are completed.

### Outputs

| Name          | Description                           |
| ------------- | ------------------------------------- |
| `progressing` | true if any deployment is progressing |
| `succeeded`   | true if all deployments are succeeded |
| `failed`      | true if any deployment is failed      |
| `completed`   | true if all deployments are completed |
| `summary`     | markdown list of all deployments      |
