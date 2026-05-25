# commit-push

Bumps the version in package.json, commits with a well-formed message, and pushes to the current branch.

## Usage

```
/commit-push <message>
```

`<message>` should follow conventional commits: `type(scope): description`.

## Steps

1. **Determine bump type** from the first word of `$ARGUMENTS`:
   - Starts with `feat` → `minor`
   - Anything else (`fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`) → `patch`
   - **Major bumps are never automatic.** They mark milestone business releases and must be triggered manually by the user (`npm run bump:major` or explicitly requesting a major bump).

2. **Run the version bump:**
   ```
   node scripts/bump-version.cjs <major|minor|patch>
   ```

3. **Stage package.json:**
   ```
   git add package.json
   ```

4. **Expand the commit message** into a well-formed description:
   - First line: the `$ARGUMENTS` as-is (keep it under 72 chars)
   - Blank line
   - Body: 2–4 sentences describing *why* the change was made and what behaviour changed, written for a future reader who has no context from this session. No bullet lists in the body unless there are genuinely distinct sub-items.
   - Trailer: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

5. **Commit** all currently staged files plus package.json using the expanded message.

6. **Get the current branch name:**
   ```
   git rev-parse --abbrev-ref HEAD
   ```

7. **Push** to that branch:
   ```
   git push origin <branch>
   ```

8. **Report** the new version, commit hash, and push status.

## Notes

- Do not add `--no-verify`. If a hook fails, fix it.
- Do not amend existing commits; always create a new one.
- If nothing is staged (clean working tree), say so and stop before bumping.
