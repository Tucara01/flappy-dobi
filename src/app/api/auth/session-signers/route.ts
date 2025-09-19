import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message');
    const signature = searchParams.get('signature');

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature are required' },
        { status: 400 }
      );
    }

    // Mock response for development
    const mockSigners = [{
      fid: 12345,
      signer: '0x' + Math.random().toString(16).substring(2, 42),
      created_at: new Date().toISOString(),
    }];

    const mockUser = {
      fid: 12345,
      username: 'testuser',
      display_name: 'Test User',
      pfp_url: 'https://via.placeholder.com/150',
    };

    return NextResponse.json({
      signers: mockSigners,
      user: mockUser,
    });
  } catch (error) {
    console.error('Error in session-signers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signers' },
      { status: 500 }
    );
  }
}
