#!/bin/bash
# klsjnh-react-pc011 一体化脚本
#   ./script011.sh gate   提交门禁：tsc → eslint(若已装) → 规范自检（docs §14/§17）
#   ./script011.sh         默认：自动版本号 + git 提交推送（原行为）

# 解析可用的 node 运行时（PATH 里没有时回退到托管路径）
resolve_node() {
  if command -v node >/dev/null 2>&1; then echo "node"; return; fi
  for c in \
    "$HOME/.workbuddy/binaries/node/versions/22.22.2-3/node.exe" \
    "D:/Environment/nodejs/node.exe" ; do
    if [ -x "$c" ]; then echo "$c"; return; fi
  done
  echo ""
}

if [ "$1" = "gate" ]; then
  set -e
  NODE="$(resolve_node)"
  if [ -z "$NODE" ]; then echo "未找到 node 运行时，gate 中止" >&2; exit 1; fi
  echo "==> [1/3] tsc 类型检查"
  "$NODE" node_modules/typescript/bin/tsc --noEmit
  if [ -x node_modules/.bin/eslint ]; then
    echo "==> [2/3] eslint"
    "$NODE" node_modules/eslint/bin/eslint.js .
  else
    echo "==> [2/3] eslint 未安装，跳过（npm install -D eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh）"
  fi
  echo "==> [3/3] 规范自检（Agent.md / 011 / 015 / 016 / 017）"
  "$NODE" tools/check-klsjnh-react-standards.mjs
  echo "gate 通过 ✅"
  exit 0
fi

vf=./.vf

if [ `git status | grep "nothing to commit" | wc -l` -eq 1 ]; then
	  echo "nothing to change ..."
	    exit
fi

v=`expr $(cat $vf) + 1`
echo $v > $vf
git add .
git commit -m "ver 0.0.$v ..."
git push
