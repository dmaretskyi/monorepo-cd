# monorepo-cd

Lets you quickly jump across packages and projects.

## Installation

```
npm i -g monorepo-cd
```

Add to your `.zshrc` or `.bashrc`:

```
eval "$(monorepo-cd --init m)"
```

## Usage

Just run `m` in your shell to enter interactive mode.

You can also immediately type the package name to navigate to it instantly:

```
m web-frontend
```

## Navigating across projects

You can also jump to a different project by using the `-p` flag:

```
m -p monorepo-cd
```

Or using an interactive mode:

```
m -p
```

**Projects are scanned starting from the directory specified in the `PROJECTS_DIR` env variable (defaults to `~/Projects`)**

## Configuring the function name

The generated bash function name can be configured in your rc file:

```
# Use `m`
eval "$(monorepo-cd --init m)"

# Use `mcd`
eval "$(monorepo-cd --init mcd)"
```
