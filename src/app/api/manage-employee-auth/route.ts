import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("Manage Employee Auth API route hit");
  try {
    const { email, password } = await req.json();
    console.log(`Received request for email: ${email}`);

    if (!email || !password) {
      console.error("Error: Email or password missing");
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Initialize Supabase Admin client
    console.log("Initializing Supabase admin client...");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log("Supabase admin client initialized.");

    // Attempt to create user
    console.log(`Attempting to create user for: ${email}`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since admin is creating it
    });

    if (createError) {
      console.warn(`Failed to create user, entering update logic. Error: ${createError.message}`);
      
      console.log(`Checking master_users table for email: ${email}`);
      const { data: masterUser } = await supabaseAdmin
        .from('master_users')
        .select('id')
        .eq('email', email.toUpperCase()) // assuming master_users emails are uppercase
        .single();
        
      if (masterUser) {
        console.log(`User found in master_users with ID: ${masterUser.id}. Attempting password update.`);
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          masterUser.id,
          { password }
        );
        
        if (updateError) {
          console.error(`Error updating password for user ID ${masterUser.id}: ${updateError.message}`);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        console.log(`Successfully updated password for user ID ${masterUser.id}`);
        return NextResponse.json({ success: true, userId: masterUser.id, action: 'updated' }, { status: 200 });
      } else {
        console.log(`User not found in master_users. Analyzing createError further.`);
        if (createError.message.includes("already registered") || createError.status === 400) {
           console.log("User is in Auth but not master_users. Attempting to find via listUsers.");
           const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
           if (listError) {
             console.error(`Error listing users: ${listError.message}`);
             throw listError;
           }
           
           const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
           if (existingUser) {
             console.log(`Found existing user in Auth with ID: ${existingUser.id}. Attempting password update.`);
             const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                { password }
             );
             if (updateError) {
               console.error(`Error updating password for existing user ID ${existingUser.id}: ${updateError.message}`);
               return NextResponse.json({ error: updateError.message }, { status: 500 });
             }
             
             console.log(`Successfully updated password for existing user ID ${existingUser.id}`);
             return NextResponse.json({ success: true, userId: existingUser.id, action: 'updated' }, { status: 200 });
           } else {
             console.error(`Create user failed with 'already registered' but could not find user in list. CreateError: ${createError.message}`);
             return NextResponse.json({ error: createError.message }, { status: 500 });
           }
        }
        
        console.error(`Unhandled createError: ${createError.message}`);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }

    console.log(`Successfully created user with ID: ${createData.user.id}`);
    return NextResponse.json({ success: true, userId: createData.user.id, action: 'created' }, { status: 200 });

  } catch (error: any) {
    console.error(`CRITICAL ERROR in manage-employee-auth API: ${error.message}`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
