import type { QuestionImportDisplayField } from './types';

const SQL_INSERT_PREFIX =
  'INSERT INTO XXX.yy (question_id, category, sub_category, at_first) VALUES';

type SqlImportRow = {
  questionId: string;
  questionUuid: string;
  category: string;
  subCategory: string | null;
  asFirst: boolean;
};

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

function toSqlStringLiteral(value: string): string {
  return `'${escapeSqlString(value)}'`;
}

function toSqlNullableStringLiteral(value: string | null): string {
  return value === null ? 'NULL' : toSqlStringLiteral(value);
}

function buildSqlValuesRow(row: SqlImportRow): string {
  return `(${row.questionId}, ${toSqlStringLiteral(row.category)}, ${toSqlNullableStringLiteral(row.subCategory)}, ${row.asFirst ? 1 : 0})`;
}

function buildSqlUuidValuesRow(row: SqlImportRow): string {
  return `(${toSqlStringLiteral(row.questionUuid)}, ${toSqlStringLiteral(row.category)}, ${toSqlNullableStringLiteral(row.subCategory)}, ${row.asFirst ? 1 : 0})`;
}

export function buildQuestionImportDisplayFields(rows: SqlImportRow[]): QuestionImportDisplayField[] {
  if (rows.length === 0) {
    return [
      { key: 'fullInsertSql', value: '' },
      { key: 'fullUuidSql', value: '' },
    ];
  }

  const valuesRows = rows.map(buildSqlValuesRow);
  const uuidValuesRows = rows.map(buildSqlUuidValuesRow);
  const fullInsertSql = `${SQL_INSERT_PREFIX}\n${valuesRows.join(',\n')};`;
  const fullUuidSql = `${SQL_INSERT_PREFIX}\n${uuidValuesRows.join(',\n')};`;

  return [
    { key: 'fullInsertSql', value: fullInsertSql },
    { key: 'fullUuidSql', value: fullUuidSql },
  ];
}
