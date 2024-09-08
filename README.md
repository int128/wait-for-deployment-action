# wait-for-deployment-action [![ts](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml)

This is an action to wait for the GitHub Deployment.

## Getting Started

To post a comment when all deployments are succeeded,

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

### Condition

If `until` is set to `succeeded`,

- When **all** deployments are succeeded, this action exits successfully.
- When **any** deployment is failed, this action exits with an error.

If `until` is set to `completed`, this action exits when all deployments are completed.

### Timeout

If `timeout-seconds` is set, this action stops after the timeout.
This action exits successfully even if any deployment is not completed.

If both `timeout-seconds` and `until: succeeded` is set, this action exits immediately when any deployment is failed.

## Specification

This action determines the status as below table.

| GitHub deployment status | Progressing | Succeeded | Failed | Completed |
| ------------------------ | ----------- | --------- | ------ | --------- |
| `queued`                 | x           | -         | -      | -         |
| `in_progress`            | x           | -         | -      | -         |
| `active`                 | -           | x         | -      | x         |
| `success`                | -           | x         | -      | x         |
| `failure`                | -           | -         | x      | x         |
| `error`                  | -           | -         | x      | x         |
| Others                   | -           | -         | -      | -         |

x: This action maps the GitHub deployment status to the corresponding column.

### Inputs

| Name                    | Default        | Description                       |
| ----------------------- | -------------- | --------------------------------- |
| `until`                 | (required)     | Either `completed` or `succeeded` |
| `initial-delay-seconds` | 10             | Initial delay before polling      |
| `period-seconds`        | 15             | Polling period                    |
| `timeout-seconds`       | -              | If set, poll until the timeout    |
| `deployment-sha`        | (required)     | Find deployments by commit        |
| `token`                 | `github.token` | GitHub token                      |

### Outputs

| Name          | Description                           |
| ------------- | ------------------------------------- |
| `progressing` | true if any deployment is progressing |
| `succeeded`   | true if all deployments are succeeded |
| `failed`      | true if any deployment is failed      |
| `completed`   | true if all deployments are completed |
| `summary`     | markdown list of all deployments      |
