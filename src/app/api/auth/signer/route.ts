import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Mock signer creation
    const mockSigner = {
      signer_uuid: 'mock-signer-' + Math.random().toString(36).substring(2, 15),
      public_key: '0x' + Math.random().toString(16).substring(2, 66),
      status: 'approved',
      created_at: new Date().toISOString(),
    };
    return NextResponse.json(mockSigner);
  } catch (error) {
    console.error('Error creating signer:', error);
    return NextResponse.json(
      { error: 'Failed to create signer' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const signerUuid = searchParams.get('signerUuid');

  if (!signerUuid) {
    return NextResponse.json(
      { error: 'signerUuid is required' },
      { status: 400 }
    );
  }

  try {
    // Mock signer lookup
    const mockSigner = {
      signer_uuid: signerUuid,
      public_key: '0x' + Math.random().toString(16).substring(2, 66),
      status: 'approved',
      created_at: new Date().toISOString(),
    };
    return NextResponse.json(mockSigner);
  } catch (error) {
    console.error('Error fetching signer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signer' },
      { status: 500 }
    );
  }
}
