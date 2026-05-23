import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Sign in as an admin first." }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const requester = authData?.user;

    if (authError || !requester || !isAdminEmail(requester.email)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", requester.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Your account is not enabled as an admin yet." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !email || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    if (isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Admin accounts are reserved and cannot be created from this form." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from("profiles")
      .update({ full_name: fullName, email, role: "rep" })
      .eq("id", data.user.id);

    return NextResponse.json({
      user: { id: data.user.id, email, fullName, role: "rep" }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
