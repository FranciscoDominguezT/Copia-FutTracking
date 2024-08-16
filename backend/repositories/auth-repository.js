import DBConfig from "../config/db-config.js";
import pkg from 'pg';
import jwt from "jsonwebtoken";
const { Client } = pkg;
const secretKey = 'mysecretkey';

export default class AuthRepository {
  loginAsync = async (entity) => {
    let returnArray = null;
    const client = new Client(DBConfig);
    try {
      await client.connect();
      const sql = 'SELECT * FROM users WHERE username = $1 AND password = $2';
      const values = [entity.username, entity.password];
      const result = await client.query(sql, values);
      await client.end();
      if (result.rows.length > 0) {
        const payload = { id: result.rows[0].id, username: result.rows[0].username };
        const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
        returnArray = { success: true, message: '', token: token };
      }
    } catch (error) {
      console.log(error);
    }
    return returnArray;
  }
  
}