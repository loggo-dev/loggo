<p align="center">
  <img src="public/logo.png" alt="Loggo" width="96" />
</p>

<h1 align="center">Loggo</h1>

<p align="center">
  A self-hosted note app for engineers. A day is a board; you drop Logs onto it all day.
</p>

<p align="center">
  <a href="https://github.com/loggo-dev/loggo/actions/workflows/ci.yml"><img src="https://github.com/loggo-dev/loggo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/loggo-dev/loggo/releases"><img src="https://img.shields.io/github/v/release/loggo-dev/loggo" alt="Latest release"></a>
  <a href="https://github.com/loggo-dev/loggo/pkgs/container/loggo"><img src="https://img.shields.io/badge/ghcr.io-loggo--dev%2Floggo-blue?logo=docker&logoColor=white" alt="Docker image"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License"></a>
  <a href="https://loggo.dev"><img src="https://img.shields.io/badge/website-loggo.dev-orange" alt="Website"></a>
  <a href="https://docs.loggo.dev"><img src="https://img.shields.io/badge/docs-docs.loggo.dev-blue" alt="Documentation"></a>
</p>

## Quickstart (Docker)

```sh
docker compose up
```

This builds the image and starts Loggo with local SQLite + file storage, persisted to `./data`. Open http://localhost:3000.

## Develop

```sh
cp .env.example .env
npm install
npm run dev
```

Or with `make`:

```sh
make dev    # install deps if needed and start the Next.js dev server
make setup  # wipe the local database and reseed it with demo data (demo@loggo.dev)
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Description |
|---|---|
| `SQLITE_PATH` | Path to the SQLite database file |
| `STORAGE_BACKEND` | `local` or `s3` |
| `STORAGE_PATH` | Local storage directory (when `STORAGE_BACKEND=local`) |
| `READ_ONLY` | Rejects all data mutations when `true` |
| `MAX_ATTACHMENT_SIZE` | Max upload size in bytes |
| `ALLOWED_FILE_TYPES` | Comma-separated list of accepted MIME types |
| `S3_*` | S3-compatible storage settings (when `STORAGE_BACKEND=s3`) |

## Deploy

Loggo runs as a Docker container for real use, and as a read-only demo on Cloudflare Workers. See the [deployment docs](https://docs.loggo.dev/deployment) for Docker, Cloudflare, and Kubernetes guides.

```sh
docker run -d \
  --name loggo \
  -p 3000:3000 \
  -v /path/to/your/data:/app/data \
  ghcr.io/loggo-dev/loggo:latest
```

Or build and run it locally with `docker compose up` (see [Quickstart](#quickstart-docker)), or `make docker-up` / `make docker-down` / `make docker-logs`.

## Testing

```sh
npm run test        # unit tests
npm run typecheck
npm run lint
npm run check       # test + typecheck + lint + build
```

## Contributing

See [`AGENTS.md`](AGENTS.md) for the project's conventions and file layout. Issues and pull requests are welcome — see the templates under [`.github`](.github).

## License

[AGPL-3.0](LICENSE)
