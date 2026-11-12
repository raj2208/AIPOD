---
id: terraform-basics
title: Terraform basics
topic: Terraform
source: notes/terraform/basics.md
source_hash: 56bbea268a50ac2660414091ee952fc986140e45
model: claude-opus-5
skill_version: 2
status: draft
---
Let's revise Terraform.

By the end of this session, you should be able to explain what Terraform is, how its workflow runs, and why its state file matters so much.

Terraform is an infrastructure as code tool made by HashiCorp.

Instead of clicking through a cloud console to create servers, networks, and databases, you describe what you want in configuration files.

Terraform then makes it real.

Those files are written in a language called HCL, the HashiCorp Configuration Language.

Those files end in dot tf.

The most important idea here is that Terraform is declarative.

You don't write the steps to get somewhere.

You describe the end result, say, one virtual machine of this size in this network.

Terraform works out what to create, change, or delete to reach it.

That's the opposite of an imperative script, where you spell out every command in order.

Terraform doesn't know how to talk to any cloud by itself.

That's the job of providers.

A provider is a plugin that translates your configuration into API calls for a specific platform, such as AWS, Azure, Google Cloud, or Kubernetes.

Inside your configuration, the things you actually build are called resources.

A resource block names a type, like an AWS instance, gives it a local name, and sets its arguments.

Sometimes you need to read something that already exists rather than create it.

For that you use a data source.

Now the workflow, which interviewers love to ask about.

The workflow has four main commands.

First, terraform init.

Init prepares the working directory by downloading the providers you need, and setting up the backend where state will live.

Second, terraform plan.

Plan compares three things: your configuration, the state file, and the real infrastructure.

Then it shows you exactly what it would add, change, or destroy, without touching anything.

Third, terraform apply.

Apply carries out that plan, usually after asking you to confirm.

And finally, terraform destroy, which tears down everything the configuration manages.

There are two helpful extras.

Terraform fmt formats your code.

Terraform validate checks that it's syntactically valid.

Next, the state file.

After every apply, Terraform records what it built in a file called terraform dot tfstate.

The state file is how Terraform maps the resources in your code to the real objects in the cloud.

Without that file, Terraform wouldn't know what it already created, and couldn't work out what needs to change.

There's one big warning here.

State can contain sensitive values in plain text, such as passwords.

So you never commit state to Git.

Instead, you store it in a remote backend, for example an encrypted S3 bucket, with access tightly controlled.

A good remote backend also supports state locking, which stops two people from running an apply at the same moment and corrupting the state.

That brings us to drift.

Drift is what happens when someone changes infrastructure by hand, outside of Terraform.

The next plan will notice that reality no longer matches your configuration.

It will then propose changes to bring things back in line.

If the resource already exists and was never created by Terraform, terraform import lets you bring it under management by adding it to the state.

Let's cover how to keep configurations clean.

Input variables let you parameterize your code, so the same configuration works for different environments.

Outputs expose useful values, like an IP address, after an apply.

Locals are named expressions that save you from repeating yourself.

And modules are reusable bundles of resources.

Every configuration has a root module, and it can call child modules, which is how teams share standard building blocks.

Terraform also builds a dependency graph.

When one resource refers to another, for instance a server that uses a subnet's ID, Terraform understands that the subnet must exist first.

That's an implicit dependency.

When there's a relationship Terraform can't see from the references, you add depends_on to make it explicit.

One last favorite interview question: count versus for_each.

Both create multiple copies of a resource.

With count, copies are tracked by position in a list.

So removing an item from the middle shifts everything after it, and Terraform may destroy and recreate resources you didn't mean to touch.

With for_each, each copy is tracked by a stable key, so adding or removing one doesn't disturb the others.

That's why for_each is usually the safer choice.

To recap.

Terraform is declarative infrastructure as code.

Providers talk to the platforms, and resources describe what you build.

The workflow is init, plan, apply, and destroy.

State links your code to reality, so protect it, store it remotely, and lock it.

Drift is the gap between code and reality, and plan reveals it.

And prefer for_each over count when items may come and go.

That's your Terraform revision.
