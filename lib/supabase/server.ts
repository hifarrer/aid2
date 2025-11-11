import { Pool } from 'pg';

/**
 * PostgreSQL Database Client Wrapper
 * 
 * This provides a Supabase-like API but uses direct PostgreSQL connection.
 * This allows the codebase to work with any PostgreSQL database (Render.com, etc.)
 * without requiring Supabase-specific infrastructure.
 */

let pool: Pool | null = null;

function getDatabasePool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string not found. Please set DATABASE_URL or SUPABASE_DB_URL in .env.local');
  }

  const isRender = connectionString.includes('render.com');
  const isSupabase = connectionString.includes('supabase.co');

  pool = new Pool({
    connectionString,
    ssl: isRender || isSupabase ? {
      rejectUnauthorized: false,
      require: isRender ? true : false
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

/**
 * Supabase-like query builder
 */
class PostgresQueryBuilder {
  private table: string;
  private selectFields: string = '*';
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private orderBy: { field: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private singleResult: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  neq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '!=', value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderBy = { field, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitCount = 1;
    return this;
  }

  // Make it thenable (promise-like) so it works with await
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }

  private buildWhereClause(): { sql: string; values: any[] } {
    if (this.whereConditions.length === 0) {
      return { sql: '', values: [] };
    }

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const condition of this.whereConditions) {
      conditions.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
      values.push(condition.value);
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }

  private buildQuery(): { sql: string; values: any[] } {
    const where = this.buildWhereClause();
    let sql = `SELECT ${this.selectFields} FROM ${this.table} ${where.sql}`;

    if (this.orderBy) {
      sql += ` ORDER BY ${this.orderBy.field} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
    }

    if (this.limitCount !== null) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    return { sql, values: where.values };
  }

  async execute(): Promise<{ data: any; error: any }> {
    const pool = getDatabasePool();
    const { sql, values } = this.buildQuery();

    try {
      const result = await pool.query(sql, values);
      
      if (this.singleResult) {
        return {
          data: result.rows[0] || null,
          error: result.rows.length === 0 ? { code: 'PGRST116', message: 'No rows returned' } : null
        };
      }

      return {
        data: result.rows,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || 'UNKNOWN',
          message: error.message,
          details: error.detail,
          hint: error.hint
        }
      };
    }
  }
}

/**
 * Supabase-like table accessor
 */
class PostgresTable {
  constructor(private table: string) {}

  select(fields: string = '*') {
    const builder = new PostgresQueryBuilder(this.table);
    builder.select(fields);
    return builder;
  }

  insert(data: any) {
    return new PostgresInsertBuilder(this.table, data);
  }

  update(data: any) {
    return new PostgresUpdateBuilder(this.table, data);
  }

  delete() {
    return new PostgresDeleteBuilder(this.table);
  }

  upsert(data: any) {
    return new PostgresUpsertBuilder(this.table, data);
  }
}

class PostgresInsertBuilder {
  private selectFields: string = '*';
  private singleResult: boolean = false;

  constructor(private table: string, private data: any) {}

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  // Make it thenable (promise-like)
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }

  async execute(): Promise<{ data: any; error: any }> {
    const pool = getDatabasePool();
    const columns = Object.keys(this.data).filter(k => this.data[k] !== undefined);
    const values = columns.map(col => this.data[col]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnsStr = columns.join(', ');

    let sql = `INSERT INTO ${this.table} (${columnsStr}) VALUES (${placeholders})`;
    sql += ` RETURNING ${this.selectFields}`;

    try {
      const result = await pool.query(sql, values);
      
      if (this.singleResult) {
        return {
          data: result.rows[0] || null,
          error: null
        };
      }

      return {
        data: result.rows,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || 'UNKNOWN',
          message: error.message,
          details: error.detail,
          hint: error.hint
        }
      };
    }
  }
}

class PostgresUpdateBuilder {
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private selectFields: string = '*';
  private singleResult: boolean = false;

  constructor(private table: string, private data: any) {}

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  // Make it thenable (promise-like)
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }

  async execute(): Promise<{ data: any; error: any }> {
    const pool = getDatabasePool();
    const updateColumns = Object.keys(this.data).filter(k => this.data[k] !== undefined);
    const updateValues = updateColumns.map(col => this.data[col]);
    
    let paramIndex = updateValues.length + 1;
    const setClause = updateColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    const whereConditions: string[] = [];
    const allValues = [...updateValues];

    for (const condition of this.whereConditions) {
      whereConditions.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
      allValues.push(condition.value);
    }

    if (whereConditions.length === 0) {
      return {
        data: null,
        error: { code: 'MISSING_WHERE', message: 'UPDATE requires WHERE clause' }
      };
    }

    let sql = `UPDATE ${this.table} SET ${setClause} WHERE ${whereConditions.join(' AND ')}`;
    sql += ` RETURNING ${this.selectFields}`;

    try {
      const result = await pool.query(sql, allValues);
      
      if (this.singleResult) {
        return {
          data: result.rows[0] || null,
          error: result.rows.length === 0 ? { code: 'PGRST116', message: 'No rows returned' } : null
        };
      }

      return {
        data: result.rows,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || 'UNKNOWN',
          message: error.message,
          details: error.detail,
          hint: error.hint
        }
      };
    }
  }
}

class PostgresDeleteBuilder {
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];

  constructor(private table: string) {}

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  // Make it thenable (promise-like)
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }

  async execute(): Promise<{ data: any; error: any }> {
    const pool = getDatabasePool();
    
    if (this.whereConditions.length === 0) {
      return {
        data: null,
        error: { code: 'MISSING_WHERE', message: 'DELETE requires WHERE clause' }
      };
    }

    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const condition of this.whereConditions) {
      whereConditions.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
      values.push(condition.value);
    }

    const sql = `DELETE FROM ${this.table} WHERE ${whereConditions.join(' AND ')} RETURNING *`;

    try {
      const result = await pool.query(sql, values);
      return {
        data: result.rows,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || 'UNKNOWN',
          message: error.message,
          details: error.detail,
          hint: error.hint
        }
      };
    }
  }
}

class PostgresUpsertBuilder {
  private whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private selectFields: string = '*';
  private singleResult: boolean = false;
  private conflictTarget: string = 'id';

  constructor(private table: string, private data: any) {}

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  select(fields: string) {
    this.selectFields = fields;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  // Make it thenable (promise-like)
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }

  async execute(): Promise<{ data: any; error: any }> {
    const pool = getDatabasePool();
    const columns = Object.keys(this.data).filter(k => this.data[k] !== undefined);
    const values = columns.map(col => this.data[col]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columnsStr = columns.join(', ');

    // Build UPDATE clause for ON CONFLICT
    const updateColumns = columns.filter(col => col !== this.conflictTarget);
    const updateClause = updateColumns.map((col, i) => `${col} = EXCLUDED.${col}`).join(', ');

    let sql = `INSERT INTO ${this.table} (${columnsStr}) VALUES (${placeholders})`;
    sql += ` ON CONFLICT (${this.conflictTarget}) DO UPDATE SET ${updateClause}`;
    sql += ` RETURNING ${this.selectFields}`;

    try {
      const result = await pool.query(sql, values);
      
      if (this.singleResult) {
        return {
          data: result.rows[0] || null,
          error: null
        };
      }

      return {
        data: result.rows,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || 'UNKNOWN',
          message: error.message,
          details: error.detail,
          hint: error.hint
        }
      };
    }
  }
}

/**
 * Supabase-like client interface
 */
class PostgresClient {
  from(table: string) {
    return new PostgresTable(table);
  }

  rpc(functionName: string, params?: any) {
    return new PostgresRpcBuilder(functionName, params);
  }
}

class PostgresRpcBuilder {
  constructor(private functionName: string, private params?: any) {}

  async execute(): Promise<{ data: any; error: any }> {
    // For now, RPC calls are not supported - return error
    return {
      data: null,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `RPC function ${this.functionName} is not supported with direct PostgreSQL connection`
      }
    };
  }
}

/**
 * Get database client (Supabase-compatible interface)
 * Uses direct PostgreSQL connection instead of Supabase API
 * 
 * Uses DATABASE_URL or SUPABASE_DB_URL from environment variables
 */
export function getSupabaseServerClient(): PostgresClient {
  // Ensure pool is initialized
  getDatabasePool();
  return new PostgresClient();
}

// Export type for compatibility
export type SupabaseClient = PostgresClient;
