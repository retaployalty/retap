import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Crea un abbonamento di test
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: session.user.id,
        plan_type: 'base',
        billing_type: 'monthly',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      subscription: data,
      message: 'Test subscription created successfully' 
    });

  } catch (error: any) {
    console.error('Error in test subscription endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 