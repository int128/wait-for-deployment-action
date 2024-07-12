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

This action determines the status as follows:

- If a deployment status is `queued` or `in_progress`, this action considers it as progressing.
- If a deployment status is `active` or `success`, this action considers it as succeeded and completed.
- If a deployment status is `failure` or `error`, this action considers it as failed and completed.

### Inputs

| Name                         | Default                                              | Description                           |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `wait-until`                 | (optional)                                           | If set, wait for the status           |
| `wait-initial-delay-seconds` | 10                                                   | Initial delay before polling          |
| `wait-period-seconds`        | 15                                                   | Polling period                        |
| `sha`                        | `github.event.pull_request.head.sha` or `github.sha` | Commit SHA or ref to find deployments |
| `token`                      | `github.token`                                       | GitHub token                          |

If `wait-until` is set to `succeeded`,

- It exits successfully when **all** deployments are succeeded
- It exits with an error when **any** deployment is failed

If `wait-until` is set to `completed`, it exits when all deployments are completed.

### Outputs

| Name          | Description                           |
| ------------- | ------------------------------------- |
| `progressing` | true if any deployment is progressing |
| `succeeded`   | true if all deployments are succeeded |
| `failed`      | true if any deployment is failed      |
| `completed`   | true if all deployments are completed |
| `summary`     | markdown list of all deployments      |
