# Changelog

## 0.2.0

- Add AbortSignal support for cancelling remaining tasks
- Add per-task timeout with configurable duration
- Add streaming results via forEachResult callback
- Add task prioritization with numeric priority levels

## 0.1.7

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.1.6

- Republish under new npm package name

## 0.1.5

- Standardize package configuration

## 0.1.4

- Add Development section to README
- Fix CI badge to reference publish.yml
- Add test script to package.json

## 0.1.0
- Initial release
- `promisePool()` for batch concurrent execution with progress callbacks
- `createPool()` for reusable concurrency-limited task runner
- Configurable concurrency, stopOnError, and progress reporting
