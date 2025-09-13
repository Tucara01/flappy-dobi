import { NextRequest, NextResponse } from 'next/server';
import { betGameMonitor } from '~/lib/betGameMonitor';

/**
 * POST /api/games/bet/monitor/control
 * Controla el monitor de juegos de bet mode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'start', 'stop', 'status'

    switch (action) {
      case 'start':
        betGameMonitor.start();
        return NextResponse.json({
          success: true,
          message: 'Bet game monitor started',
          action: 'start'
        });

      case 'stop':
        betGameMonitor.stop();
        return NextResponse.json({
          success: true,
          message: 'Bet game monitor stopped',
          action: 'stop'
        });

      case 'status':
        const stats = await betGameMonitor.getStats();
        return NextResponse.json({
          success: true,
          message: 'Monitor status retrieved',
          action: 'status',
          stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error controlling bet game monitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/games/bet/monitor/control
 * Obtiene el estado actual del monitor
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await betGameMonitor.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'Monitor status retrieved',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting monitor status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
