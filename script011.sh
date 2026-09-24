#!/bin/bash
# klsjnh-react-pc011 一体化脚本
#   ./script011.sh gate      门禁：tsc → eslint → 规范自检（docs §14/§17）
#   ./script011.sh build011  门禁 + 生产构建（产物 dist/）
#   ./script011.sh start011  启动开发服务器
#   ./script011.sh           默认：门禁 → 版本号自增 → 提交 → 推送
#
# 约定：默认路径**先过门禁再提交**（docs/015 §017.7）；提交只加白名单路径，
#      不使用 `git add .`，避免把临时脚本/快照文件裹进提交。

set -e

# 提交白名单：新增顶层文件/目录时须同步登记，否则不会被提交
TRACKED_PATHS=(
  src docs tools
  package.json pnpm-lock.yaml pnpm-workspace.yaml
  vite.config.ts tsconfig.json eslint.config.js postcss.config.js index.html
  README.md Agent.md .gitignore .gitattributes .npmrc script011.sh .env.example .vf
)

# 解析可用的 node 运行时（PATH 里没有时回退到托管路径）
# 候选覆盖两种 shell 形态：Git Bash 用 D:/ 前缀，WSL bash 用 /mnt/d/ 前缀
# （本项目终端可能是 WSL，`command -v node` 与 D:/ 前缀在其下均不可用）
resolve_node() {
  if command -v node >/dev/null 2>&1; then echo "node"; return; fi
  for c in \
    "$HOME/.workbuddy/binaries/node/versions/22.22.2-3/node.exe" \
    "D:/Environment/nodejs/node.exe" \
    "/mnt/d/Environment/nodejs/node.exe" ; do
    if [ -x "$c" ]; then echo "$c"; return; fi
  done
  echo ""
}

NODE="$(resolve_node)"
if [ -z "$NODE" ]; then echo "未找到 node 运行时，中止" >&2; exit 1; fi

run_gate() {
  echo "==> [1/3] tsc 类型检查"
  "$NODE" node_modules/typescript/bin/tsc --noEmit
  # 门禁前置硬性要求：eslint 缺失即失败（017 §D5「可跳过的检查等于没有检查」）
  if [ ! -x node_modules/.bin/eslint ]; then
    echo "eslint 未安装，门禁失败（pnpm install -D eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh）" >&2
    exit 1
  fi
  echo "==> [2/3] eslint"
  "$NODE" node_modules/eslint/bin/eslint.js .
  echo "==> [3/3] 规范自检（Agent.md / 011 / 015 / 016 / 017）"
  "$NODE" tools/check-klsjnh-react-standards.mjs
  echo "gate 通过 ✅"
}

case "$1" in
  gate)
    run_gate
    exit 0
    ;;
  build011)
    run_gate
    echo "==> 生产构建"
    "$NODE" node_modules/vite/bin/vite.js build
    exit 0
    ;;
  start011)
    echo "==> 启动开发服务器"
    exec "$NODE" node_modules/vite/bin/vite.js
    ;;
  "")
    # 默认路径：先门禁，后提交推送
    run_gate

    # 先暂存白名单路径，确认确有变更再自增版本号（避免空提交也涨版本）
    git add -A -- "${TRACKED_PATHS[@]}"
    if git diff --cached --quiet; then
      echo "nothing to change ..."
      exit 0
    fi

    vf=./.vf
    if [ ! -f "$vf" ]; then echo 0 > "$vf"; fi
    v=$(expr "$(cat "$vf")" + 1)
    echo "$v" > "$vf"
    git add -A -- "$vf"

    git commit -m "ver 0.0.$v ..."
    git push
    echo "已提交并推送 ver 0.0.$v"
    exit 0
    ;;
  *)
    echo "未知参数：$1" >&2
    echo "可用：gate | build011 | start011（不传参数 = 门禁 + 提交推送）" >&2
    exit 1
    ;;
esac
