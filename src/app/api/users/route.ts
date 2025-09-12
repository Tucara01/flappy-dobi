import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  const { searchParams } = new URL(request.url);
  const fids = searchParams.get('fids');
  
  // If no API key, return a mock user for development
  if (!apiKey) {
    // console.warn('Neynar API key not configured, returning mock user data');
    if (!fids) {
      return NextResponse.json(
        { error: 'FIDs parameter is required' },
        { status: 400 }
      );
    }
    
    // Return mock data for development
    const fidsArray = fids.split(',').map(fid => parseInt(fid.trim()));
    const mockUsers = fidsArray.map(fid => ({
      fid,
      username: `user_${fid}`,
      display_name: `User ${fid}`,
      pfp_url: null,
      verified_addresses: [],
      score: Math.floor(Math.random() * 1000)
    }));
    
    return NextResponse.json({ users: mockUsers });
  }

  if (!fids) {
    return NextResponse.json(
      { error: 'FIDs parameter is required' },
      { status: 400 }
    );
  }

  try {
    const neynar = new NeynarAPIClient({ apiKey });
    const fidsArray = fids.split(',').map(fid => parseInt(fid.trim()));
    
    const { users } = await neynar.fetchBulkUsers({
      fids: fidsArray,
    });

    return NextResponse.json({ users });
  } catch (error) {
    // console.error('Failed to fetch users:', error);
    
    // If API fails, return mock data as fallback
    const fidsArray = fids.split(',').map(fid => parseInt(fid.trim()));
    const mockUsers = fidsArray.map(fid => ({
      fid,
      username: `user_${fid}`,
      display_name: `User ${fid}`,
      pfp_url: null,
      verified_addresses: [],
      score: Math.floor(Math.random() * 1000)
    }));
    
    return NextResponse.json({ users: mockUsers });
  }
}
