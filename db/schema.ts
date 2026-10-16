import { sql } from 'void/db'
import { index, integer, sqliteTable, text } from 'void/schema-d1'

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

export const blogNotes = sqliteTable(
  'blog_notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    note: text('note').notNull()
  },
  (table) => [index('blog_notes_slug_id_idx').on(table.slug, table.id)]
)
