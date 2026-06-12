// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Store settings in memory (can be replaced with a database table later)
const defaultSettings = {
  businessName: 'My Business',
  businessEmail: 'business@example.com',
  businessPhone: '+91-XXXXXXXXXX',
  gstin: 'XXXXXXXXXXXXXXXX',
  address: '123 Business St',
  city: 'City',
  state: 'State',
  pincode: '000000',
  currency: 'INR',
  taxRate: 18,
}

let currentSettings = { ...defaultSettings }

export async function GET() {
  try {
    return NextResponse.json({ data: currentSettings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ data: defaultSettings })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    currentSettings = {
      ...currentSettings,
      businessName: body.businessName || currentSettings.businessName,
      businessEmail: body.businessEmail || currentSettings.businessEmail,
      businessPhone: body.businessPhone || currentSettings.businessPhone,
      gstin: body.gstin || currentSettings.gstin,
      address: body.address || currentSettings.address,
      city: body.city || currentSettings.city,
      state: body.state || currentSettings.state,
      pincode: body.pincode || currentSettings.pincode,
      currency: body.currency || currentSettings.currency,
      taxRate: body.taxRate || currentSettings.taxRate,
    }

    return NextResponse.json({ data: currentSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
