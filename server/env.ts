import { config } from 'dotenv'

// Inside Docker, env comes from the container environment (IS_DOCKER=1).
// Otherwise (bare npm start / tsx dev), hydrate from the project .env file.
// Must be imported before any module reads process.env.
if (!process.env.IS_DOCKER) {
  config({ quiet: true })
}
