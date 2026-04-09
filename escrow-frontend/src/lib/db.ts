import mysql from "mysql2/promise";

export type DatabaseQueryValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | null
  | undefined
  | Buffer
  | Uint8Array;

export type DatabaseQueryValues = readonly DatabaseQueryValue[];

function getMysqlPort(): number {
  const configuredPort = process.env.MYSQL_PORT?.trim() ?? "";
  let port = 3306;

  if (configuredPort) {
    port = Number.parseInt(configuredPort, 10);
  }

  if (Number.isNaN(port)) {
    throw new Error("MYSQL_PORT must be a valid number.");
  }

  return port;
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: getMysqlPort(),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
