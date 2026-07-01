import { NextResponse } from 'next/server';
import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'myhomesofasinvoice';

// Helper function to convert S3 stream to string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

// GET /api/invoices/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const key = `invoices/${id}.json`;
  try {
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
    const jsonStr = await streamToString(getRes.Body);
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error(`Error fetching invoice ${key}:`, error);
    if (error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to fetch invoice from S3' }, { status: 500 });
  }
}

// PUT /api/invoices/[id]
export async function PUT(request, { params }) {
  const { id } = await params;
  const key = `invoices/${id}.json`;
  try {
    const invoice = await request.json();
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(invoice),
      ContentType: 'application/json'
    }));
    return NextResponse.json({ message: 'Invoice updated successfully in S3' });
  } catch (error) {
    console.error(`Error updating invoice ${key}:`, error);
    return NextResponse.json({ error: 'Failed to update invoice in S3' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const key = `invoices/${id}.json`;
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
    return NextResponse.json({ message: 'Invoice deleted successfully from S3' });
  } catch (error) {
    console.error(`Error deleting invoice ${key}:`, error);
    return NextResponse.json({ error: 'Failed to delete invoice from S3' }, { status: 500 });
  }
}
