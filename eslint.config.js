/**
 * ESLint 扁平配置（eslint v9+）
 * 配套 docs/011.agreements 与 015/016.coding-standards：no-any / no-non-null-assertion / 禁用 React.FC 等。
 * 安装：npm install -D eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // 忽略：构建产物 / 依赖 / mock 与 tools（自有口径，见 016 §14）/ 根目录一次性脚本 / IDE 工具目录
  { ignores: ['dist', 'node_modules', 'src/mock', 'tools', '*.mjs', '*.cjs', '.workbuddy'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { import: 'readonly', document: 'readonly', window: 'readonly', fetch: 'readonly' },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // mock 层豁免 no-explicit-any：mock handler 需要接收任意后端请求体并回任意响应体，
    // 强类型化会把 40+ handler 全部改成类型断言。与 tools/check-klsjnh-react-standards.mjs
    // 的既有口径一致（mock 层的 any 记为 WARN 而非 ERROR）。
    files: ['src/mock/**/*.ts', 'src/types/view/mock.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
