/**
 * Optional avatar upload port for signup.
 * Presentation/infrastructure supplies MinIO-backed implementation.
 */
export type AvatarUploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export interface AvatarUploaderPort {
  upload(file?: AvatarUploadFile): Promise<string>;
}
