import { Pool } from "pg";
import config from "./dbConfig";
// Database connection
const pool = new Pool(config.database);

export default pool