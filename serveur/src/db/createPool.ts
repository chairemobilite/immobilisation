import { Pool } from "pg";
import config from "./dbConfig";
// Database connection
const pool = new Pool(config.database);

pool.on('error', (err, _client) => {
    console.error('Unexpected error on idle client', err.message);
    // The pool handles cleanup automatically — no action needed.
    // A new client will be created on the next request.
});

export default pool