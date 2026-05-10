const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => console.error('DB error:', err.message));

async function initializeDB() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, pitch TEXT NOT NULL, audience TEXT NOT NULL, pain_point TEXT NOT NULL, differentiator TEXT NOT NULL, conversion_goal TEXT DEFAULT 'free_trial', tone TEXT DEFAULT 'warm_helpful', active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS platform_connections (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE, platform TEXT NOT NULL, credentials JSONB, posting_freq TEXT DEFAULT 'daily', optimal_times TEXT[] DEFAULT ARRAY['08:00', '12:00', '18:00'], active BOOLEAN DEFAULT TRUE, connected_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS reddit_monitors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE, subreddit TEXT NOT NULL, keywords TEXT[] NOT NULL, active BOOLEAN DEFAULT TRUE, last_checked TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS reddit_threads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), monitor_id UUID REFERENCES reddit_monitors(id), product_id UUID REFERENCES products(id), thread_id TEXT UNIQUE NOT NULL, thread_title TEXT NOT NULL, thread_body TEXT, thread_url TEXT NOT NULL, subreddit TEXT NOT NULL, thread_age_hrs NUMERIC, draft_reply TEXT, status TEXT DEFAULT 'pending', urgency TEXT DEFAULT 'normal', posted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS content_queue (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id) ON DELETE CASCADE, platform TEXT NOT NULL, content_type TEXT NOT NULL, body TEXT NOT NULL, image_url TEXT, image_prompt TEXT, link TEXT, utm_params JSONB, status TEXT DEFAULT 'pending', urgency TEXT DEFAULT 'normal', predicted_eng INTEGER DEFAULT 3, scheduled_for TIMESTAMPTZ, approved_at TIMESTAMPTZ, posted_at TIMESTAMPTZ, buffer_post_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS content_performance (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), content_id UUID REFERENCES content_queue(id), product_id UUID REFERENCES products(id), platform TEXT NOT NULL, clicks INTEGER DEFAULT 0, signups INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, mrr_added NUMERIC DEFAULT 0, tracked_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS content_patterns (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id), platform TEXT NOT NULL, angle TEXT NOT NULL, avg_clicks NUMERIC DEFAULT 0, avg_signups NUMERIC DEFAULT 0, sample_size INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS weekly_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id), week_of DATE NOT NULL, posts_published INTEGER DEFAULT 0, total_clicks INTEGER DEFAULT 0, signups INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, mrr_added NUMERIC DEFAULT 0, best_content_id UUID REFERENCES content_queue(id), recommendations TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS email_sequences (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID REFERENCES products(id), name TEXT NOT NULL, trigger TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, delay_hours INTEGER DEFAULT 0, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS email_sends (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sequence_id UUID REFERENCES email_sequences(id), recipient_email TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT NOW(), opened BOOLEAN DEFAULT FALSE, clicked BOOLEAN DEFAULT FALSE)`,
    `CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status)`,
    `CREATE INDEX IF NOT EXISTS idx_queue_product ON content_queue(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON content_queue(scheduled_for)`,
    `CREATE INDEX IF NOT EXISTS idx_reddit_status ON reddit_threads(status)`,
    `CREATE INDEX IF NOT EXISTS idx_performance_product ON content_performance(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_performance_content ON content_performance(content_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`
  ];

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (!err.message.includes('already exists')) console.error(stmt, err.message);
    }
  }
  console.log('✓ Database ready');
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderByCol = null;
    this.orderDir = 'ASC';
    this.limitVal = null;
    this.selectCols = '*';
  }

  select(cols) {
    this.selectCols = cols || '*';
    return this;
  }

  eq(field, val) {
    this.filters.push({ field, op: '=', val });
    return this;
  }

  neq(field, val) {
    this.filters.push({ field, op: '!=', val });
    return this;
  }

  in(field, vals) {
    this.filters.push({ field, op: 'IN', val: vals });
    return this;
  }

  gte(field, val) {
    this.filters.push({ field, op: '>=', val });
    return this;
  }

  order(col, opts = {}) {
    this.orderByCol = col;
    this.orderDir = opts.ascending === false ? 'DESC' : 'ASC';
    return this;
  }

  limit(n) {
    this.limitVal = n;
    return this;
  }

  async execute() {
    let query = `SELECT ${this.selectCols} FROM ${this.table}`;
    const params = [];

    for (const f of this.filters) {
      query += ` AND ${f.field}${f.op === 'IN' ? `=ANY($${params.length + 1})` : `${f.op}$${params.length + 1}`}`;
      params.push(f.val);
    }

    query = query.replace(' AND', ' WHERE');

    if (this.orderByCol) query += ` ORDER BY ${this.orderByCol} ${this.orderDir}`;
    if (this.limitVal) query += ` LIMIT ${this.limitVal}`;

    try {
      const res = await pool.query(query, params);
      return { data: res.rows, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async single() {
    const res = await this.limit(1).execute();
    return { data: res.data?.[0] || null, error: res.error };
  }
}

class InsertBuilder {
  constructor(table, data) {
    this.table = table;
    this.data = Array.isArray(data) ? data : [data];
  }

  async select() {
    if (!this.data.length) return { data: null, error: null };
    const cols = Object.keys(this.data[0]);
    const values = [];
    const placeholders = this.data.map((row, i) => {
      const placeholder = cols.map((col, j) => {
        values.push(row[col]);
        return `$${values.length}`;
      }).join(',');
      return `(${placeholder})`;
    }).join(',');

    try {
      const res = await pool.query(`INSERT INTO ${this.table}(${cols.join(',')}) VALUES ${placeholders} RETURNING *`, values);
      return { data: res.rows, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async single() {
    const res = await this.select();
    return { data: Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null, error: res.error };
  }
}

class UpdateBuilder {
  constructor(table, data) {
    this.table = table;
    this.data = data;
    this.filters = [];
  }

  eq(field, val) {
    this.filters.push({ field, op: '=', val });
    return this;
  }

  in(field, vals) {
    this.filters.push({ field, op: 'IN', val: vals });
    return this;
  }

  neq(field, val) {
    this.filters.push({ field, op: '!=', val });
    return this;
  }

  async select() {
    const setCols = Object.keys(this.data).map((k, i) => `${k}=$${i + 1}`).join(',');
    let query = `UPDATE ${this.table} SET ${setCols}`;
    const params = Object.values(this.data);

    for (const f of this.filters) {
      query += ` AND ${f.field}${f.op === 'IN' ? `=ANY($${params.length + 1})` : `${f.op}$${params.length + 1}`}`;
      params.push(f.val);
    }

    query = query.replace(' AND', ' WHERE');
    query += ' RETURNING *';

    try {
      const res = await pool.query(query, params);
      return { data: res.rows, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async single() {
    const res = await this.select();
    return { data: Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null, error: res.error };
  }
}

class DeleteBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
  }

  eq(field, val) {
    this.filters.push({ field, op: '=', val });
    return this;
  }

  async execute() {
    let query = `DELETE FROM ${this.table}`;
    const params = [];

    for (const f of this.filters) {
      query += ` AND ${f.field}${f.op}$${params.length + 1}`;
      params.push(f.val);
    }

    query = query.replace(' AND', ' WHERE');

    try {
      await pool.query(query, params);
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}

const supabase = {
  from: (table) => ({
    select: (cols) => new QueryBuilder(table).select(cols),
    insert: (data) => new InsertBuilder(table, data),
    update: (data) => new UpdateBuilder(table, data),
    delete: () => new DeleteBuilder(table)
  })
};

module.exports = supabase;
module.exports.initializeDB = initializeDB;
