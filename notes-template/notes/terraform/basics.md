# Terraform basics

Sample note. Replace it with your own.

## What it is
- Infrastructure as code (IaC) tool made by HashiCorp.
- Describe servers, networks, databases in config files instead of clicking through a cloud console. Terraform makes it real.
- Config language is HCL (HashiCorp Configuration Language). Files end in `.tf`.

## Declarative
- Declarative: describe the end result (e.g. one VM of this size in this network), Terraform works out what to create, change or delete.
- Opposite of an imperative script, where you spell out every command in order.

## Providers, resources, data sources
- Terraform can't talk to a cloud by itself. A **provider** is a plugin that turns config into API calls for a platform: AWS, Azure, Google Cloud, Kubernetes.
- **Resource** = a thing you build. A resource block names a type (e.g. an AWS instance), gives it a local name, sets arguments.
- **Data source** = read something that already exists instead of creating it.

## Workflow (interview favourite)
- `terraform init`: prepares the working directory. Downloads providers, sets up the backend where state lives.
- `terraform plan`: compares config vs state file vs real infrastructure. Shows what it would add, change or destroy. Touches nothing.
- `terraform apply`: carries out the plan, usually asks to confirm.
- `terraform destroy`: tears down everything the config manages.
- Extras: `terraform fmt` formats code, `terraform validate` checks it is syntactically valid.

## State
- After every apply Terraform records what it built in `terraform.tfstate`.
- State maps resources in code to real objects in the cloud. Without it Terraform wouldn't know what it already created or what needs to change.
- Warning: state can contain sensitive values (passwords) in plain text. Never commit it to Git.
- Use a remote backend instead, e.g. an encrypted S3 bucket with tight access control.
- Good remote backend supports state locking: stops two people running apply at the same moment and corrupting state.

## Drift
- Drift = someone changes infrastructure by hand, outside Terraform.
- Next `plan` notices reality no longer matches config and proposes changes to bring it back in line.
- `terraform import`: bring a resource that already exists (never created by Terraform) under management by adding it to state.

## Keeping config clean
- Input variables: parameterize code so the same config works for different environments.
- Outputs: expose useful values (e.g. an IP address) after apply.
- Locals: named expressions, avoid repeating yourself.
- Modules: reusable bundles of resources. Every config has a root module; it can call child modules. How teams share standard building blocks.

## Dependency graph
- Terraform builds a dependency graph.
- Implicit dependency: one resource refers to another (e.g. a server uses a subnet's ID), so the subnet is created first.
- Explicit: when Terraform can't see the relationship from references, add `depends_on`.

## count vs for_each (interview favourite)
- Both create multiple copies of a resource.
- `count`: copies tracked by position in a list. Removing an item from the middle shifts everything after it, Terraform may destroy and recreate resources you didn't mean to touch.
- `for_each`: each copy tracked by a stable key. Adding or removing one doesn't disturb the others.
- So `for_each` is usually the safer choice.

## Recap
- Terraform = declarative infrastructure as code.
- Providers talk to platforms, resources describe what you build.
- Workflow: init, plan, apply, destroy.
- State links code to reality: protect it, store it remotely, lock it.
- Drift = gap between code and reality, plan reveals it.
- Prefer `for_each` over `count` when items may come and go.
