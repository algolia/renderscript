# Contributing

## Releasing

> The release is an automated process in the CI, there is nothing to do.

### Manual Release

If no version has been created: make a new version by pushing a commit with semantic-release format:

```sh
git commit --allow-empty -m "fix: bump version"
```

Then build and release in one single command

```sh
yarn release
```
