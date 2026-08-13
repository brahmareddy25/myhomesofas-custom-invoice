import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  GetObjectCommand 
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


// GET /api/invoices
export async function GET() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'invoices/'
    });
    const listData = await s3.send(listCommand);
    const contents = listData.Contents || [];
    const jsonFiles = contents.filter(obj => obj.Key.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all files in parallel
    const invoicePromises = jsonFiles.map(async (obj) => {
      try {
        const getRes = await s3.send(new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: obj.Key
        }));
        const jsonStr = await streamToString(getRes.Body);
        return JSON.parse(jsonStr);
      } catch (err) {
        console.error(`Failed to fetch S3 object ${obj.Key}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(invoicePromises);
    const invoices = results.filter(inv => inv !== null);

    // Sort descending by timestamp or document sequence
    invoices.sort((a, b) => {
      const timeA = parseInt((a.id || '').replace(/\D/g, ''), 10) || 0;
      const timeB = parseInt((b.id || '').replace(/\D/g, ''), 10) || 0;
      if (timeA && timeB && timeA !== timeB) {
        return timeB - timeA;
      }
      const numA = parseInt((a.invoiceNo || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.invoiceNo || '').replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices from S3' }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(request) {
  try {
    const invoice = await request.json();
    if (!invoice.id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    const key = `invoices/${invoice.id}.json`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(invoice),
      ContentType: 'application/json'
    }));
    return NextResponse.json({ message: 'Invoice created successfully in S3' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    return NextResponse.json({ error: 'Failed to save invoice to S3' }, { status: 500 });
  }
}
