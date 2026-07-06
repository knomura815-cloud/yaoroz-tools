import { Pool, types } from "pg";

// DATE型(oid 1082)はデフォルトでJSのDateオブジェクトに変換されてしまうため、
// "YYYY-MM-DD" の文字列のまま扱うようにする
types.setTypeParser(1082, (value: string) => value);

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString =
    process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "データベース接続情報が設定されていません（環境変数 POSTGRES_URL または DATABASE_URL）。"
    );
  }

  pool = new Pool({
    connectionString,
    // サーバーレス環境では実行ごとの接続を最小限にする
    max: 1,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  return pool;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}
