/**
 * Avatar upload for profile updates.
 * Presentation supplies Multer file; infrastructure uploads to object storage.
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
