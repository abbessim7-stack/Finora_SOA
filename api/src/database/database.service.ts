import { Injectable, InternalServerErrorException, Logger, OnModuleDestroy } from '@nestjs/common';
import { createPool, type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';

/**
 * Accès MySQL via mysql2 avec requêtes préparées paramétrées : aucune valeur
 * utilisateur n'est concaténée dans le SQL.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'finora',
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      charset: 'utf8mb4',
      decimalNumbers: true,
    });

    this.pool
      .getConnection()
      .then((connection) => {
        this.logger.log('Connexion MySQL établie');
        connection.release();
      })
      .catch((error: Error) => {
        this.logger.error(`Connexion MySQL impossible : ${error.message}`);
      });
  }

  async query<T extends RowDataPacket[] | RowDataPacket[][] = RowDataPacket[]>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    try {
      const [rows] = await this.pool.query<T>(sql, params);
      return rows;
    } catch (error) {
      this.logger.error(`Requête échouée : ${(error as Error).message}`);
      throw new InternalServerErrorException('Erreur lors de l’accès aux données.');
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(sql, params);
      return result;
    } catch (error) {
      this.logger.error(`Exécution échouée : ${(error as Error).message}`);
      throw new InternalServerErrorException('Erreur lors de l’accès aux données.');
    }
  }

  async transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if ((error as { status?: number }).status) throw error;
      throw new InternalServerErrorException('La transaction a échoué.');
    } finally {
      connection.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
