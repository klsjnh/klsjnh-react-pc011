/**
 * SQL 工具集：格式化、压缩、方言构建
 * 从老项目 klsjnh-react-dev011_20260909_011 迁移
 */
import { format, type SqlLanguage } from 'sql-formatter';

export type SqlFormatLanguage = 'auto' | 'mysql' | 'oracle' | 'sqlserver' | 'postgresql' | 'sql';

export type SqlFormatMode = 'standard' | 'compress';

const AUTO_DIALECT_ORDER: SqlLanguage[] = ['mysql', 'plsql', 'transactsql', 'postgresql', 'sqlite', 'sql'];

const DIALECT_MAP: Record<Exclude<SqlFormatLanguage, 'auto'>, SqlLanguage[]> = {
  mysql: ['mysql'],
  oracle: ['plsql'],
  sqlserver: ['transactsql'],
  postgresql: ['postgresql'],
  sql: ['sql'],
};

function resolveDialects(language: SqlFormatLanguage = 'auto'): SqlLanguage[] {
  if (language === 'auto') return AUTO_DIALECT_ORDER;
  return DIALECT_MAP[language];
}

export interface FormatSqlResult {
  ok: boolean;
  sql: string;
  dialect?: SqlLanguage;
  message?: string;
}

export function formatSQL(
  sql: string,
  options?: {
    language?: SqlFormatLanguage;
    mode?: SqlFormatMode;
  },
): string {
  const result = tryFormatSQL(sql, options);
  if (!result.ok) {
    throw new Error(result.message || 'SQL 格式化失败');
  }
  return result.sql;
}

export function tryFormatSQL(
  sql: string,
  options?: {
    language?: SqlFormatLanguage;
    mode?: SqlFormatMode;
  },
): FormatSqlResult {
  const input = sql ?? '';
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, sql: input, message: '请输入 SQL 语句' };
  }

  if (options?.mode === 'compress') {
    return { ok: true, sql: compressSQL(trimmed), dialect: 'sql' };
  }

  const dialects = resolveDialects(options?.language);
  let lastError = 'SQL 格式化失败，请检查语法或切换方言';

  for (const dialect of dialects) {
    try {
      const formatted = format(trimmed, {
        language: dialect,
        tabWidth: 2,
        linesBetweenQueries: 1,
        keywordCase: 'lower',
      });
      return { ok: true, sql: formatted, dialect };
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  return { ok: false, sql: input, message: lastError };
}

export function compressSQL(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .trim();
}


