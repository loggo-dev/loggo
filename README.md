<p align="center">
  <img src="public/img.png" alt="Loggo" width="96" />
</p>

<h1 align="center">Loggo</h1>

<p align="center">
  A self-hosted note app for engineers. A day is a board; you drop Logs onto it all day.
</p>

<p align="center">
  <a href="https://docs.loggo.dev">Docs</a> ·
  <a href="https://github.com/loggo-dev/docs">Docs repo</a>
</p>

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
