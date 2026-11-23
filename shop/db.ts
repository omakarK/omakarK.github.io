import { AsyncLocalStorage } from 'node:async_hooks';
import { createPool, type PoolConnection, type ResultSetHeader } from 'mysql2/promise';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running the shop.');
export const pool = createPool({ uri: process.env.DATABASE_URL, connectionLimit: 10, timezone: 'Z' });
const transaction = new AsyncLocalStorage<PoolConnection>();
type Parameter = string | number | boolean | Buffer | null;

export async function all<T extends object>(sql: string, ...parameters: Parameter[]): Promise<T[]> {
  const [rows] = await (transaction.getStore() ?? pool).execute(sql, parameters);
  return rows as T[];
}

export async function get<T extends object>(sql: string, ...parameters: Parameter[]): Promise<T | undefined> {
  return (await all<T>(sql, ...parameters))[0];
}

export async function run(sql: string, ...parameters: Parameter[]): Promise<ResultSetHeader> {
  const [result] = await (transaction.getStore() ?? pool).execute<ResultSetHeader>(sql, parameters);
  return result;
}

export function atomic<Args extends unknown[], Result>(
  work: (...args: Args) => Promise<Result>, commerce = true
): (...args: Args) => Promise<Result> {
  return async (...args) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Serialize catalog and order writes so quotes, price changes and reservations share one inventory view.
      if (commerce) await connection.execute("SELECT setting_key FROM settings WHERE setting_key = 'commerce_lock' FOR UPDATE");
      const result = await transaction.run(connection, () => work(...args));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
}
