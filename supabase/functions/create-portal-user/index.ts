// File: supabase/functions/create-portal-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contactId, email } = await req.json();
    if (!contactId || !email) {
      throw new Error("Contact ID and email are required.");
    }

    // FIX: Use environment variables with a custom prefix to avoid conflicts.
    const supabaseAdmin = createClient(
      Deno.env.get('APP_SUPABASE_URL') ?? '',
      Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Create a new user in the auth system
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true, // Automatically confirm the email
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        if (getUserError) throw getUserError;
        
        const { error: updateError } = await supabaseAdmin
          .from('contacts')
          .update({ auth_user_id: existingUser.user.id })
          .eq('id', contactId);
        if (updateError) throw updateError;
        
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
        });
        if (resetError) throw resetError;

        return new Response(JSON.stringify({ message: `Existing user linked. A login link has been sent to ${email}.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      throw authError;
    }

    // 2. Link the new auth user to the contact record
    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({ auth_user_id: authUser.user.id })
      .eq('id', contactId);

    if (updateError) throw updateError;

    // 3. Trigger a "magic link" email for the new user
    const { error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
    });

    if (magicLinkError) throw magicLinkError;

    return new Response(JSON.stringify({ message: `Portal access created. A login link has been sent to ${email}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
