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

## Basic usage (command line)
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

## Basic usage (API)

```ts
//All params are optional. Same params can be used as for the command line, except for -h and -v.
const params = {
  config: 'my-environment', //Use config `pubsy-my-environment.yml` in the current folder.
  environment: 'local', //User environment definition named 'local' in config file
}
let p = new Pubsy(params);
//To execute a build
p.build();
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
|label| string | `null` | (optional) Used with the `pubsy run [label]` command.
|enabled| boolean | `true` | Set to false to skip this task during a build.
| params | any | Depends on task | The task specific parameters.

Some tasks are remote tasks. Those are tasks executed over SSH. For them to work, they need the remote settings in the environment to be set.

### Echo
Task name: `echo`

The echo task simply display one or more messages. You can use variables from the environment in your messages by encasing them in `%`. For example `%name%` will print the environment name (if available). 

This task is a good starting point for how to make your own tasks.

| Property | type | default | description | 
| --- | --- | --- | --- |
| message | string | 'Hello Planet!' | (optional) The message you want to send.
| messages | string[] | `null` | (optional) If you want to print mutliple messages, use this one instead.

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
    description: Which environment is this?
    params:
      message: "It is %name%. The buildpath is %buildPath%"
```

### Remove files
Task name: `rm`

BE CAREFUL AS THIS CAN MESS THINGS UP! FILES WILL BE DELETED! (I may or may not had to redo a few tests that wiped my entire repo folder...)

| Property | type | default | description | 
| --- | --- | --- | --- |
| targets | string / string[] |  | The folders and/or files to `rm -rf`. 
| useBuildPath | boolean | `true` | (optional) When true, it will prepend the targets with the environment buildPath. When true and no buildPath exist, an error will be thrown for safety.

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
|source| string / string[] |  | The source files/patterns to copy. Supports globbing.
|cwdSource| string | `null` | (optional) Change working directory for the source files.
|exclude| string / string[] | `null` | (optional) Files / patterns to exclude. Supports globbing.
|dest| string |  | The destination. This will be prepended with the Environment `buildPath` if available.
|flatten| boolean | `false` | (optional) Don't keep the folder structure.

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
Task name: `zip`

Creates a compressed zip file.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string / string[] |  | The source files/patterns to zip. Supports globbing.
|cwd| string | `null` | (optional) Change working directory for the source files.
|exclude| string / string[] | `null` | (optional) Files / patterns to exclude. Supports globbing.
|dest| string | `files.zip` | (optional) The destination. This will be prepended with the Environment `buildPath` if available. Must end in `.zip`

#### Example
```yaml
tasks:
  - name: zip
    description: Compressing files
    label: zipTest
    params: 
      cwd: test/assets
      source: '**/*'
      dest: 'testFiles.zip'
```

### Angular build
Task name: `ngBuild`

Create an angular build using the `ng` command line tool. 

| Property | type | default | description | 
| --- | --- | --- | --- |
|base| string | `/` | (optional) The base element (`<base href="/">`)
|cwd| string | Empty string` | (optional) The directory where the angular project is.
|dest| string | `dist/` | (optional) The destination. This will be prepended with the Environment `buildPath` if available.

#### Example
```yaml
  - name: ngBuild
    description: 'Building Angular App'
    params: 
      base: /my-folder/
      dest: .build/ng/public/
      cwd: /path/to/angular/app
```

### Copy to remote
Task name: `copyToRemote`

Copies files from the local machine place to a remote. Supports globbing.
The sources cannot be paths starting with `.'`, `../` or `/`, because we need to keep the structure to output. To influence the structure you can use `cwdSource` to change the working directory for the sources.

Requires remote to be configured in environment.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string / string[] |  | The source files/patterns to copy. Supports globbing.
|cwdSource| string | `null` | (optional) Change working directory for the source files.
|exclude| string / string[] | `null` | (optional) Files / patterns to exclude. Supports globbing.
|dest| string | Empty string | (optional) The destination. This will be prepended with the Environment `deployPath` if available.
|flatten| boolean | `false` | (optional) Don't keep the folder structure.

#### Example
```yaml
  - name: copyToRemote
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
  - name: copyToRemote
    description: 'Minimal'
    params: 
      source: 'test/assets/**/*'
```

### Unzip remote (beta)
Task name: `unzipRemote`

Unzip a zip file remotely. Note that the zip file should exist remotely already. (Use `copyToRemote` to make that happen.)

Requires remote to be configured in environment.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string |  | The source zip file.
|dest| string | Empty string | (optional) The destination. This will be prepended with the Environment `deployPath` if available.
|removeAfter| boolean | `false` | (optional) Remove the zip file after extracting.

#### example
```yaml
  - name: unzipRemote
    description: Unzip files remotely
    params: 
      source: testFiles.zip
      dest: release-1/
      removeAfter: true
```

### Symlink remote (beta)
Task name: `symlinkRemote`

Create a symlink on the remote. Will overwrite any existing symlink if it exists. Works for both files and folders.

Requires remote to be configured in environment.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string |  | The target the link should point to.
|dest| string |  | The (path and) name of the link. 
|cwd| string | `null` | (optional) The working directory. (Will `cd` into this dir before creating the symlink.)

### Deploy remote
Task name: `deployRemote`

This task is basically a shorthand for `zip`, `copyToRemote`, `unzip` and `symlink`. 

In the `environment.deployPath` (remotely) it will create a new folder with a timestamp (e.g. `build-2018-12-27-1545907026579`). This has the format `[Year]-[Month]-[Day]-[Unix timestamp]`. This way deployments are sorted by date, there won't be any conflicts (unless you rollout twice in the same millisecond) and it's human readable.

A symlink called `current` will be created or updated in the `deployPath` which will point to the latest build.

The oldest build folders will be deleted if there are more than `environment.keepDeployments` deployments. It's recommended to keep at least 5, so you can rollback if you need to.

Requires remote to be configured in environment.

| Property | type | default | description | 
| --- | --- | --- | --- |
|source| string / string[] |  | The source files/patterns to deploy. Supports globbing.
|cwd| string | `null` | (optional) Change working directory for the source files.
|exclude| string / string[] | `null` | (optional) Files / patterns to exclude. Supports globbing.

#### Example
```yaml
  - name: deployRemote
    description: Deploy to remote
    params: 
      source: '**/*'
      exclude: '.*'
      cwd: 'test/files/'
```

### Rollback remote
Task name: `rollbackRemote`

Rolling back can be done through a task if you wish, but is more commonly accessible through the command line. When used through the command line no additional settings in the yaml file are necessary. (The remote environment must be set up.)

```
pubsy rollback # Rollback to 1 deployment earlier

pubsy rollback 3 # Will rollback 3 deployments (if available)

pubsy rollback build-2018-12-27-1545907026579 # Will rollback to deployment build-2018-12-27-1545907026579
```

This command will rollback to the previous available deployment. This is dependent on there being a previous deployment available. See `environment.keepDeployments` for more info. 

If a deployment is not available, an error will be thrown.

## Todo
[ ] Testing of some tasks
[ ] Error handling could be improved
[ ] A way for custom tasks to be loaded dynamically