# Pubsy
Publishing/Deployment library for deploying Angular and other stuff. 

This library is designed to create a deployment on a remote server using ssh. It switches deployments using symlinks, and supports rollbacks. All configuration is done through yaml files.

It's currently very much a work in process.

## Features
It has tasks for many common actions such as:
- Create angular build: `ng build [params]`
- Copying files around locally
- Copy files to remote server (compressed)
- Create symlinks for deployments and settings files/folders
- Rollbacks

All building can be done locally, to avoid your server having to build / minify / etc. 

# Documentation

## Installation 

```
npm i -g pubsy
```

## Basic usage
```bash
# Build and deploy based on `pubsy.yml` in the current folder.
pubsy build

# Build and deploy based on `pubsy-my-environment.yml` in the current folder.
pubsy -c my-environment build 

# Build and deploy based on `/path/to/pubsy.yml`.
pubsy -c "/path/to/pubsy.yml" build 

# Execute task labeled `ngBuild` in `pubsy.yml`
pubsy run ngbuild

# See help output
pubsy -h
```

## Environments

Environments contain settings for the local build folders and the remote deploy folders. 

If no environment is configured, an empty environment with default settings is assumed. If environments are configured, you should either set one as default, or specify an environment in the command line with the `-e` flag.

| Property | type | default | description | 
| --- | --- | --- | --- |
| name | string | |A name for reference
| default | boolean | `false` | (optional) set to `true` to make the default environment to deploy to. 
| buildPath | string | Empty string | (optional) default path that is prefixed with various tasks params (see tasks)
| isRemote | boolean | `false` | (optional) Is this a remote environment? If `true`, then `host` and `deployPath` should be set.
| deployPath | string | Empty string | (optional) Path on the remote server where files will be copied to.
| host | string | `null`| (optional) The remote host. Can be IP address or FQDN.
| user | string | Current user | (optional) The user on the remote. Default: the current user.
| key | string | `~/.ssh/id_rsa` | (optional) The path to the private key to authenticate with.
| keepDeployments | number | `10` | (optional) The number of previous deployments to keep.

### Example

```yaml
tasks:
[...]
environments:
  - name: local
    buildPath: .build/intermediate/
    deployPath: /var/www/my-app/
    default: true
  - name: remote-prd-1
    buildPath: .build/intermediate/
    isRemote: true
    deployPath: /var/www/my-app/
    host: example.com
    user: thewizard
    key: /home/thewizard/deployment-keys/private.key
```

## Tasks
Every task has a set of properties that exist for all tasks. Tasks also have individual params that make sense for that specific task.

Global params:
| Property | type | default | description | 
| --- | --- | --- | --- |
|name | string | | The task name. 
|description | string | Empty string | (optional) Something to describe what's going to happen.
|label| string | Empty string | Used with the `pubsy run [label]` command.
|enabled| boolean | `true` | Set to false to skip this task during a build.
| params | any | Depends on task | The task specific parameters.

### Echo
Task name: `echo`

The echo task simply display one or more messages. This task is a great example of how to make your own tasks, or if you feel like adding one or more messages in between.

| Property | type | default | description | 
| --- | --- | --- | --- |
| message | string | 'Hello Planet!' | The message you want to send.
| messages | string[] | `null` | If you want to print mutliple messages, use this one instead.

#### Example
```yaml
tasks:
  - name: echo
    description: Multiple messages
    params: 
      messages:
        - Here I am 
        - Alone again
        - I need you now
        - To hold my hand
  - name: echo
    description: The same task twice?
    params:
      message: Yup. 
```

### Remove files
Task name: `rm`

BE CAREFUL AS THIS CAN MESS THINGS UP! FILES WILL BE DELETED! (I may or may not had to redo a few tests that wiped my entire repo folder...)

| Property | type | default | description | 
| --- | --- | --- | --- |
| targets | string / string[] | `null` | The folders to `rm -rf`. 

#### Example
```yaml
tasks:
  - name: rm
    description: Clear build folder.
    label: clean
    params: 
      targets: .build/*
```

### Copy files (with globbing)
Task name: `copy`

Copies files from one place to another. Supports globbing.
The sources cannot be paths starting with `.'`, `../` or `/`, because we need to keep the structure to output. To influence the structure you can use `cwdSource` to change the working directory for the sources.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string / string[] | Empty string | The source files/patterns to copy. Supports globbing.
|cwdSource| string | `null` | Change working directory for the source files.
|exclude| string / string[] | Empty string | Files / patterns to exclude. Supports globbing.
|dest| string | Empty string | The destination. This will be prepended with the Environment `buildPath` if available.
|flatten| boolean | `false` | Don't keep the folder structure.

#### Example
```yaml
tasks:
  - name: copy
    description: All possible options
    label: allOptions
    params: 
      cwdSource: test/base/for/source
      source: 
        - assets/subfolder/*
        - assets/testing.md
        - assets/*.txt
      exclude: '**/file.txt'
      cwdDest: test/base/for/output
      dest: subfolder/under/buildpath/
      flatten: true      
  - name: copy
    description: 'Minimal with label'
    label: minimal
    params: 
      source: 'test/assets/**/*'
```

### Zip files
### Angular build
### Copy to remote
### Unzip remote
### Symlink remote
### Deploy remote
### Rollback remote






## Todo
Documentation / Testing
Error handling could be improved
Verbosity should be a thing
Success of exec commands should be checked
Output default help
colors and spinners
A way for custom tasks to be loaded dynamically

# Documentation
The entire module works off of the yaml file. All tasks are 

## Environments
An environment has a name and a bunch of optional properties. 

## Tasks

### Settig up the configuration yaml
