
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import { promises as fs } from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query

  if (typeof file !== 'string') {
    res.status(400).json({ error: 'Invalid file name' })
    return
  }

  const filePath = path.join(process.cwd(), 'samples', file)

  try {
    const fileContents = await fs.readFile(filePath, 'utf8')
    res.status(200).send(fileContents)
  } catch (error) {
    res.status(404).json({ error: 'File not found' })
  }
}
