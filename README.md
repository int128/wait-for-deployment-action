# aggregate-deployments-action [![ts](https://github.com/int128/aggregate-deployments-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/aggregate-deployments-action/actions/workflows/ts.yaml)

This is an action to aggregate GitHub Deployments against the current commit.


## Getting Started

To run this action, create a workflow as follows:

```yaml
name: deployment-status

on:
  deployment_status:

jobs:
  aggregate:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: int128/aggregate-deployments-action@v1
        id: deployments
      - if: steps.deployments.output.succeeded
        run: echo application successfully deployed
```

### Inputs

| Name | Default | Description
|------|----------|------------
| `sha` | `github.event.pull_request.head.sha || github.sha` | commit SHA or ref to find deployments
| `token` | `github.token` | GitHub token


### Outputs

| Name | Description
|------|------------
| `completed` | true if all deployments are completed
| `succeeded` | true if all deployments are succeeded
| `summary` | markdown list of all deployments
