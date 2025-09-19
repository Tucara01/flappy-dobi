import { NextResponse } from 'next/server';

const requiredParams = ['message', 'signature'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string | null> = {};
  for (const param of requiredParams) {
    params[param] = searchParams.get(param);
    if (!params[param]) {
      return NextResponse.json(
        {
          error: `${param} parameter is required`,
        },
        { status: 400 }
      );
    }
  }

  const message = params.message as string;
  const signature = params.signature as string;

  try {
    // Mock response for development
    const mockSigners = [{
      fid: 12345,
      signer: '0x' + Math.random().toString(16).substring(2, 42),
      created_at: new Date().toISOString(),
    }];

    return NextResponse.json({
      signers: mockSigners,
    });
  } catch (error) {
    console.error('Error fetching signers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signers' },
      { status: 500 }
    );
  }
}
