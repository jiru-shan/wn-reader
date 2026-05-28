import Link from 'next/link';

import { neon } from '@neondatabase/serverless';

async function getData(novel_id: number) {
  const sql = neon(process.env.DATABASE_URL);
  // note: not vulnerable to SQL injection; see https://neon.com/blog/sql-template-tags
  const response = await sql`SELECT * FROM chapters WHERE novel_id=${novel_id}`; // tables: novels, chapters
  // TODO: assert that length is exactly 1
  return response;
}

export default async function TocPage({ params }) {
  // TODO: include data on the entire book as well
  const { slug } = await params;
  const novel_id = slug;
  const contents = await getData(novel_id);
  console.log(contents); // TODO: remove this
  return <>
    <ul>
      {contents.map(chapter =>
        // TODO: use sort_order
        <li key={chapter.id}>
          <Link href={`/novel/${novel_id}/${chapter.id}`}>
            {chapter.title}
          </Link>
        </li>
      )}
    </ul>
  </>;
}
