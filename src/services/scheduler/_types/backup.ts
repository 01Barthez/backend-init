// Configuration interface for backup settings
export interface BackupConfig {
  mongo: {
    uri: string;
    dbName: string;
    collections: string[];
    dumpPath: string;
  };
  minio: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucketName: string;
  };
  retentionDays: number;
  timezone: string;
  email: {
    from: string;
    to: string;
  };
}
