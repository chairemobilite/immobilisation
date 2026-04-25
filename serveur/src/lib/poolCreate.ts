import config from "../config";
import { Pool } from "pg";

export const pool = new Pool(config.database);