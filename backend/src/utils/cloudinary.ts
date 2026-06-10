import cloudinary from 'cloudinary';
import { config } from '../config';
import multer from 'multer';

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadImage = async (
  file: Express.Multer.File,
  folder: string = 'campusconnect'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || '');
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteImage = async (url: string): Promise<void> => {
  const publicId = url.split('/').pop()?.split('.')[0];
  if (publicId) {
    await cloudinary.v2.uploader.destroy(publicId);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  },
});
