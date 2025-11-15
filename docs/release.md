# Release Checklist (npm 1.0.0)

1. **Version & metadata**
   - [ ] Update `package.json` version (e.g., `1.0.0`).
   - [ ] Confirm package metadata (name, description, repository, keywords, license, `files`/`.npmignore`).
2. **Artifacts**
   - [ ] Run `pnpm run build` (ensure `dist/` is current).
   - [ ] Verify `bin/oracle` points to the compiled entry point.
3. **Changelog & docs**
   - [ ] Update `CHANGELOG.md` (or release notes) with highlights.
   - [ ] Ensure README reflects current CLI options (globs, `--status`, heartbeat behavior).
4. **Validation**
   - [ ] `pnpm vitest`
   - [ ] `pnpm run lint`
5. **Publish**
   - [ ] `npm login` (or confirm session) & check 2FA.
   - [ ] `npm publish --access public`
6. **Post-publish**
   - [ ] `git tag v1.0.0 && git push --tags`
   - [ ] Announce / share release notes.
