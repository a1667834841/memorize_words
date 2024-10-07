import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json({ error: 'Speech service configuration is missing' }, { status: 500 });
    }

    const headers = {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: headers
      }
    );

    if (response.ok) {
      const token = await response.text();
      return NextResponse.json({ token: token, region: speechRegion });
    } else {
      return NextResponse.json({ error: 'Failed to retrieve token' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error retrieving speech token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}