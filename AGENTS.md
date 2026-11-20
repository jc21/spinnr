# Agent Instructions

Instructions for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini, etc.)
working in this repository. Humans are welcome to read it too.

## Project goal

Create a simple, browser only picker wheel without any advertising or annoying
stuff as seen in other public spinners.

Every change should either fix a real bug or add a feature that many users have
asked for. Speculative features, drive-by refactors and "improvements" nobody
asked for are easy to spot as AI slop and will be closed.

## Before you start: research

- Read the git history (`git log`, `git log -p <path>`) for the files you are
  touching, and look at merged PRs on GitHub
  (https://github.com/jc21/spinnr/pulls?q=is%3Apr+is%3Amerged)
  to understand why the code is the way it is before you plan a change.
- Check for existing issues and open PRs that already cover the same work.
- A code review bot reviews every PR, so get the change right the first time:
  plan carefully, follow these rules, and test before submitting.

## Working rules

- **Stay on topic.** One change per commit and per PR. Don't bundle unrelated
  fixes, reformatting or refactoring together.
- **Don't bump dependencies** unless your change specifically requires it.
  GitHub's Dependabot is responsible for keeping the stack up to date and safe.
- **No secrets.** Never commit or paste real API keys, DNS provider credentials,
  certificates, private keys or passwords, including in tests and fixtures.

## CI

- GitHub Actions are **not** used in this project. Don't add workflows.
- CI runs on Jenkins at a private server
