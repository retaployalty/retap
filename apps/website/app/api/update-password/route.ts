import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verifica che l'utente sia autenticato
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Verifica la password corrente
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword
    });

    if (signInError) {
      console.error('Current password verification failed:', signInError);
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Se arriviamo qui, la password corrente è corretta
    // Ora aggiorna la password dell'utente
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error: any) {
    console.error('Error in update password API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 