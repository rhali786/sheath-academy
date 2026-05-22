import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

console.log('Connecting to:', url.replace(/:([^:@]+)@/, ':***@'))

const sql = postgres(url, { ssl: 'require', connect_timeout: 10 })

try {
  const result = await sql`SELECT current_database() as db, version() as v`
  console.log('Connected! DB:', result[0].db)
  console.log('Version:', result[0].v.split(' ')[0])
} catch (e) {
  console.error('Connection failed:', e.message)
  console.error('Code:', e.code)
} finally {
  await sql.end()
}
