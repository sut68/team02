import { NextResponse } from 'next/server';
import { performSecurityScan } from '@/app/lib/security-advanced';

export async function GET() {
  try {
    const securityScan = performSecurityScan();
    
    return NextResponse.json({
      success: true,
      securityScore: securityScan.score,
      maxScore: 100,
      percentage: securityScan.score,
      status: securityScan.score === 100 ? '✅ Perfect Security' : '⚠️ Review Needed',
      categories: securityScan.categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SECURITY] Scan failed:', error);
    return NextResponse.json(
      { success: false, error: 'Security scan failed' },
      { status: 500 }
    );
  }
}
