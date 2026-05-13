// AI-Vaidya — pages/api/ai-vaidya/query.js | MediVault Platform
// ==============================================================
// Next.js API route: POST /api/ai-vaidya/query
// Delegates all logic to ai_vaidya/api/query_handler.js

import { handler } from '../../../ai_vaidya/api/query_handler';

export const config = {
  api: {
    // Increase body size limit to 12MB for file uploads (base64-encoded)
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default handler;
