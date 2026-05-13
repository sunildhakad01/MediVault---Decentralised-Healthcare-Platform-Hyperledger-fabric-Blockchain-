// Catch-all proxy: forwards any /api/* call from Next.js to the Express backend.
// This makes Next.js port 3000 and Express port 3002 behave as a single API path.
import axios from 'axios';

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  const { path: segments, ...queryParams } = req.query;
  const urlPath = Array.isArray(segments) ? segments.join('/') : segments || '';
  const url = `${EXPRESS_URL}/api/${urlPath}`;

  const forwardHeaders = {};
  if (req.headers['authorization'])   forwardHeaders['authorization']   = req.headers['authorization'];
  if (req.headers['content-type'])    forwardHeaders['content-type']    = req.headers['content-type'];
  if (req.headers['x-admin-session']) forwardHeaders['x-admin-session'] = req.headers['x-admin-session'];

  try {
    const response = await axios({
      method: req.method,
      url,
      data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      params: queryParams,
      headers: forwardHeaders,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(502).json({ success: false, error: 'Backend unreachable', message: err.message });
  }
}
