import express ,{Application,Request, Response}from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import { createApiRouter } from './api/routes';
import config from './config';
import listEndpoints from 'express-list-endpoints';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import {pool} from './lib/poolCreate';
import { requireAuth } from './middleware/requireAuth';

// Create Express app
const app = express();
const port = config.server.port;

// Middleware for cors
app.use(cors({
  origin: process.env.TRUSTED_FRONTEND ? process.env.TRUSTED_FRONTEND : "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// add better-auth middleware for auth routes
app.all("/api/auth/{*any}",toNodeHandler(auth));

// Move JSON middleware after auth middle ware to ensure auth routes are processed first
app.use(express.json({ limit: '10mb' }));
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return requireAuth(req, res, next);
});
// Routes for actual queries
app.use('/api', createApiRouter(pool,app));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(port, async () => {
  console.log(`Server running at ${process.env.BACKEND_URL}`);
  console.log(`Hôte DB: ${config.database.host} Nom BD: ${config.database.database}`)
  console.log(`Server running at ${new Date().toISOString()}`); 
  let client
  try{
    client = await pool.connect()
    const query = "SELECT tablename,tableowner FROM pg_catalog.pg_tables WHERE schemaname='public';"
    const result = await client.query(query)
    console.log('Requête de validation paramètres db a réussi!!!!\n')
  }catch(error:any){
    console.error('Erreur rencontrée lors de la connexion. Vérifiez paramètres de connexion\n',error)
  }finally{
    if(client){
      client.release()
    }
  }
});



// Graceful shutdown
process.on('SIGTERM', () => {
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  pool.end();
  process.exit(0);
});