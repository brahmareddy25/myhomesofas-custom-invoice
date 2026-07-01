import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

// Manually parse .env file
if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf8');
  envText.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    }
  });
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'myhomesofasinvoice';

async function cleanBucket() {
  const seedKey = 'invoices/seed-invoice-1.json';
  console.log(`Attempting to delete seeded mock invoice: ${seedKey}...`);
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: seedKey
    });
    await s3.send(command);
    console.log('✅ Seeded mock invoice deleted successfully from S3.');
  } catch (error) {
    console.error('❌ Failed to delete seeded mock invoice:', error.message);
  }
}

cleanBucket();
