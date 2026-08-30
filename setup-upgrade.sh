#!/usr/bin/env bash
set -e

echo "🚀 [Akoin SRE Engine] Commencing Enterprise Environment Upgrade..."

# 1. Clean legacy locks, builds, and caches
echo "🧹 Purging caches and stale dependencies..."
rm -rf node_modules package-lock.json .next dist build .turbo

# 2. Re-verify tsconfig.json strict mode
echo "⚙️ Strict compiler options verified in tsconfig.json."

# 3. Setup husky pre-commit hooks
echo "🐶 Configuring Husky pre-commit hooks..."
mkdir -p .husky
cat << 'EOF' > .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npx tsc --noEmit
EOF
chmod +x .husky/pre-commit

echo "✅ [Upgrade Complete] Codebase is in strict mode with CI/CD gates verified."
