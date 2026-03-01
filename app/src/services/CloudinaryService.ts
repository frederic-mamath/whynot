import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

class CloudinaryService {
  /**
   * Upload a base64-encoded image to Cloudinary
   */
  async uploadImage(base64Data: string): Promise<CloudinaryUploadResult> {
    // Ensure the string has the proper data URI prefix
    const dataUri = base64Data.startsWith("data:")
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "whynot/products",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // max 1200x1200, keep aspect ratio
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Delete an image from Cloudinary by its public ID
   */
  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

export const cloudinaryService = new CloudinaryService();
