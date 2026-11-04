// Vercel detects this Express entry point and serves the exported app as a
// serverless function. The standalone Render/local listener stays in server/.
import express from 'express';
import { createApp } from './server/src/app';

const app: ReturnType<typeof express> = createApp();

export default app;
