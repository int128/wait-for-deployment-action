# wait-for-deployment-action [![ts](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/wait-for-deployment-action/actions/workflows/ts.yaml)

This is an action to wait for the GitHub Deployment.

## Getting Started

To create a comment when all deployments are succeeded,

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
            ## Deployed successfully
            ${{ steps.deployment.outputs.summary }}
```

To create a comment when all deployments are completed or timed out,

```yaml
name: wait-for-deployment-succeeded

on:
  pull_request:

jobs:
  notify:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: int128/wait-for-deployment-action@v1
        id: deployment
        with:
          timeout-seconds: 300
          until: completed
          deployment-sha: ${{ github.event.pull_request.head.sha || github.sha }}
      - if: steps.deployment.outputs.succeeded == 'true'
        uses: int128/comment-action@v1
        with:
          post: |
            ## :white_check_mark: Deployed successfully
            ${{ steps.deployment.outputs.summary }}
      - if: steps.deployment.outputs.progressing == 'true'
        uses: int128/comment-action@v1
        with:
          post: |
            ## :construction: Deployment is in progress
            ${{ steps.deployment.outputs.summary }}
      - if: steps.deployment.outputs.failed == 'true'
        uses: int128/comment-action@v1
        with:
          post: |
            ## :x: Deployment failed
            ${{ steps.deployment.outputs.summary }}
```

### Wait for the condition

If `until` is set to `succeeded`,

- When **all** deployments are succeeded, this action exits successfully.
- When **any** deployment is failed, this action exits with an error.

If `until` is set to `completed`,

- When **all** deployments are completed, this action exits successfully.

### Set a timeout

If `timeout-seconds` is set, this action stops after the timeout.
This action determines the exit code based on the condition at the timeout.

## Specification

This action determines the outputs as below table.

| GitHub deployment status | Progressing | Succeeded | Failed | Completed |
| ------------------------ | ----------- | --------- | ------ | --------- |
| QUEUED                   | x           | -         | -      | -         |
| IN_PROGRESS              | x           | -         | -      | -         |
| ACTIVE                   | -           | x         | -      | x         |
| SUCCESS                  | -           | x         | -      | x         |
| FAILURE                  | -           | -         | x      | x         |
| ERROR                    | -           | -         | x      | x         |
| Others                   | -           | -         | -      | -         |

x: This action maps the GitHub deployment status to the corresponding column.

### Inputs

| Name                    | Default        | Description                             |
| ----------------------- | -------------- | --------------------------------------- |
| `until`                 | (required)     | Either `completed` or `succeeded`       |
| `initial-delay-seconds` | 10             | Initial delay before polling in seconds |
| `period-seconds`        | 15             | Polling interval in seconds             |
| `timeout-seconds`       | -              | If set, poll until the timeout          |
| `deployment-sha`        | (required)     | Find the deployments of the commit      |
| `token`                 | `github.token` | GitHub token                            |

### Outputs

| Name          | Description                           |
| ------------- | ------------------------------------- |
| `progressing` | true if any deployment is progressing |
| `succeeded`   | true if all deployments are succeeded |
| `failed`      | true if any deployment is failed      |
| `completed`   | true if all deployments are completed |
| `summary`     | Markdown list of all deployments      |
