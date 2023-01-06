import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { Pool } from "pg";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  //   event: APIGatewayProxyEvent,
  //   context: Context

  const pool = await new Pool({
    user: "postgres",
    host: "cdkteststack-dbinstance310a317f-5xqesh3mk9xr.cib7cnndkcpk.us-east-1.rds.amazonaws.com",
    database: "cdktestdb",
    password: "w--6feBTrvZ^F^F2Z45NoGeg4rDwSU",
    port: 5432,
  });

  const res = await pool.query("SELECT version()");

  return {
    body: `${res.rows[0].version}`,
    statusCode: 200,
  };
};
