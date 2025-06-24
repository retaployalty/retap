import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Scambia il codice per una sessione
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=Verification+failed`);
      }

      if (data.user) {
        // Verifica se il profilo esiste già
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        // Se il profilo non esiste, crealo
        if (!profile) {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.user.id,
                first_name: data.user.user_metadata?.first_name || '',
                last_name: data.user.user_metadata?.last_name || '',
                phone_number: data.user.user_metadata?.phone_number || '',
                email: data.user.email
              }
            ]);

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
          }
        }

        // Reindirizza all'onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=Verification+error`);
    }
  }

  // If no code, redirect to login page
  return NextResponse.redirect(`${requestUrl.origin}/auth`);
} 