# Changelog

## [1.2.7](https://github.com/loggo-dev/loggo/compare/v1.2.6...v1.2.7) (2026-09-07)


### Bug Fixes

* remove title prop from LogCardSkeleton and LogEditor for cleaner UI ([6ccd6a3](https://github.com/loggo-dev/loggo/commit/6ccd6a315e8bec70fad16ebfa16a5d2528bfed86))

## [1.2.6](https://github.com/loggo-dev/loggo/compare/v1.2.5...v1.2.6) (2026-09-07)


### Bug Fixes

* update database_id in wrangler.jsonc for correct database reference ([1f3e169](https://github.com/loggo-dev/loggo/commit/1f3e169f744c6012005a23a2d6fb83cb0ab52062))

## [1.2.5](https://github.com/loggo-dev/loggo/compare/v1.2.4...v1.2.5) (2026-09-07)


### Bug Fixes

* add isLocked property to logs and related components for enhanced log management ([16eb17f](https://github.com/loggo-dev/loggo/commit/16eb17f530bf72e5806a97fd6d51e63bc7ffa69f))

## [1.2.4](https://github.com/loggo-dev/loggo/compare/v1.2.3...v1.2.4) (2026-09-07)


### Bug Fixes

* include database migrations in Dockerfile for runtime accessibility ([185eec6](https://github.com/loggo-dev/loggo/commit/185eec6d36a091f5a1a46e42f91f13c326ded168))

## [1.2.3](https://github.com/loggo-dev/loggo/compare/v1.2.2...v1.2.3) (2026-09-06)


### Bug Fixes

* update readOnly logic to incorporate DEMO_MODE and ensure proper storage handling ([6d9b551](https://github.com/loggo-dev/loggo/commit/6d9b55128c904c534d5363772757ad080426ce8b))

## [1.2.2](https://github.com/loggo-dev/loggo/compare/v1.2.1...v1.2.2) (2026-09-06)


### Bug Fixes

* adjust eslint rules for sessionStorage state restoration and add .wrangler to ignored files ([2a56c14](https://github.com/loggo-dev/loggo/commit/2a56c148c0a679160ff63d1ea68876704ad2aef8))

## [1.2.1](https://github.com/loggo-dev/loggo/compare/v1.2.0...v1.2.1) (2026-09-06)


### Bug Fixes

* stop gitignoring the checked-in CloudflareEnv ambient types ([88d47a8](https://github.com/loggo-dev/loggo/commit/88d47a8db8e455fbe2ab777611be41c0924f879b))

## [1.2.0](https://github.com/loggo-dev/loggo/compare/v1.1.0...v1.2.0) (2026-09-06)


### Features

* add Docker support with Dockerfile, docker-compose, and .dockerignore ([f8a2912](https://github.com/loggo-dev/loggo/commit/f8a29123c1e0b01914e7c86bf3ec16af17d9431b))
* enhance auth form UI with improved layout and styling ([3afb4da](https://github.com/loggo-dev/loggo/commit/3afb4dad86458938e3ae6fb8b6a03b241691d015))

## [1.1.0](https://github.com/loggo-dev/loggo/compare/v1.0.0...v1.1.0) (2026-09-06)


### Features

* update release workflow to build for Cloudflare Workers and apply D1 migrations ([68cb4dd](https://github.com/loggo-dev/loggo/commit/68cb4dd6456d1c7e0996b50423907f850e56b7b9))

## 1.0.0 (2026-09-06)


### Features

* add database schema for attachments, logs, tags, and workspaces ([026d82a](https://github.com/loggo-dev/loggo/commit/026d82abb76ab1e37c90e3eca4d288b3151bc9f9))
* add initial project structure with basic components and configuration ([e78e198](https://github.com/loggo-dev/loggo/commit/e78e198c84bf6d93b4cccc839bc7d39fe3119b4c))
* add internal routes for demo reseeding and update documentation for feature changes ([c5254df](https://github.com/loggo-dev/loggo/commit/c5254df0d0f3d0bcae6d5f773fcf9a30a01bd261))
* add zIndex and duplicate log functionality to logs ([defc963](https://github.com/loggo-dev/loggo/commit/defc963c6947260226028c192648db3e77f315d0))
* enhance appearance and instance settings UI with responsive layouts and tabbed theme selection ([028a412](https://github.com/loggo-dev/loggo/commit/028a412a4c0ebcc54eae5424d1917459d110c965))
* enhance attachments view with image preview dialog and routing for log details ([2ed963b](https://github.com/loggo-dev/loggo/commit/2ed963bc3cb37b4fb82dddbf3d4e9fa5ff40668c))
* implement template management with CRUD operations and apply templates functionality ([4b488bb](https://github.com/loggo-dev/loggo/commit/4b488bb3b716f30d2d2c84c2b009406038ca5baf))
* refactor canvas context into separate transform and interaction contexts ([bb4dbe1](https://github.com/loggo-dev/loggo/commit/bb4dbe1cd74742442db4655bddb114dc196af7e9))
* update README with new logo and additional badge links for CI, releases, Docker image, license, and documentation ([149c72f](https://github.com/loggo-dev/loggo/commit/149c72f8fca4b0afd708e4a2690860309484d173))
* update WorkspaceIcon to use color prop for better styling control ([d398c66](https://github.com/loggo-dev/loggo/commit/d398c66ba2336264d71f45796e0a9afd29431a6f))
