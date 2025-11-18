# Oracle Notifier helper (macOS, arm64)

Builds a tiny signed helper app for macOS notifications with the Oracle icon.

## Build

```bash
cd vendor/oracle-notifier
./build-notifier.sh
```

- Requires Xcode command line tools (swiftc) and a macOS Developer ID certificate; otherwise it falls back to ad-hoc signing.
- Output: `OracleNotifier.app` (arm64 only), bundled with `OracleIcon.icns`.

## Usage
The CLI prefers this helper on macOS; if it fails or is missing, it falls back to toasted-notifier/terminal-notifier.

## Permissions
After first run, allow notifications for “Oracle Notifier” in System Settings → Notifications.
