import sql from 'mssql';

const config = {
  user: process.env.FUTUREPOS_SQL_USER || '',
  password: process.env.FUTUREPOS_SQL_PASSWORD || '',
  server: process.env.FUTUREPOS_SQL_SERVER || 'SERVER.CESSQL',
  database: process.env.FUTUREPOS_SQL_DATABASE || 'fpos5',
  port: process.env.FUTUREPOS_SQL_PORT ? parseInt(process.env.FUTUREPOS_SQL_PORT) : 1433,
  options: {
    encrypt: false, // Cambia a true si usas Azure o necesitas SSL
    trustServerCertificate: true, // true para entornos locales o certificados self-signed
  },
};

export async function getFuturePOSEmployees() {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT TOP 100 [EmployeeID], [LastName], [FirstName], [Badge] FROM dbo.Employee`;
    return result.recordset;
  } catch (err) {
    console.error('SQL error', err);
    throw err;
  } finally {
    await sql.close();
  }
}
