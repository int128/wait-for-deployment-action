# aggregate-deployments-action [![ts](https://github.com/int128/aggregate-deployments-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/aggregate-deployments-action/actions/workflows/ts.yaml)

This is an action to aggregate GitHub Deployments against the current commit.

## Getting Started

### Example: notify deployment_status event

To notify the change of deployment status to a comment in the pull request,

```yaml
name: deployment-status

on:
  deployment_status:

jobs:
  notify:
    if: github.event.deployment_status.state == 'success' || github.event.deployment_status.state == 'failure'
    runs-on: ubuntu-latest
    steps:
      - uses: int128/aggregate-deployments-action@v1
        id: deployments
      - uses: int128/comment-action@v1
        with:
          update-if-exists: replace
          post: |
            ## Deploy completed
            ${{ steps.deployments.outputs.summary }}
```

### Example: wait for the deployments

To wait until all deployments are completed,

```yaml
name: wait-for-deployment-completed

on:
  pull_request:

jobs:
  notify:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: int128/aggregate-deployments-action@v1
        id: deployments
        with:
          wait-until: succeeded
      - uses: int128/comment-action@v1
        with:
          post: |
            ## Deploy completed
            ${{ steps.deployments.outputs.summary }}
```

## Specification

### Inputs

| Name                         | Default                                              | Description                           |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `wait-until`                 | (optional)                                           | If set, wait for the status           |
| `wait-initial-delay-seconds` | 10                                                   | Initial delay before polling          |
| `wait-period-seconds`        | 15                                                   | Polling period                        |
| `sha`                        | `github.event.pull_request.head.sha` or `github.sha` | Commit SHA or ref to find deployments |
| `token`                      | `github.token`                                       | GitHub token                          |

### Outputs

| Name          | Description                           |
| ------------- | ------------------------------------- |
| `progressing` | true if any deployment is progressing |
| `completed`   | true if all deployments are completed |
| `succeeded`   | true if all deployments are succeeded |
| `summary`     | markdown list of all deployments      |
