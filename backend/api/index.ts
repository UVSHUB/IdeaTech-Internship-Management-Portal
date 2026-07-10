// Vercel serverless entry point.
// An Express app is itself a valid (req, res) handler, so we simply re-export it.
// All routing is handled inside the app; vercel.json forwards every request here.
import app from '../src/app';

export default app;
