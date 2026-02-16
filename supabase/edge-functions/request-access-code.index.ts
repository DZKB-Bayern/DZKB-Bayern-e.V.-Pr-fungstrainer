import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRIMARY_BLUE = "#0968B4";
const PRIMARY_BLUE_DARK = "#0b4f86";

const LOGO_URL =
  "https://dzkb.bayern/wp-content/uploads/2025/02/DZKB_Logo_Hundefuehrerschein.png";
const PAW_URL =
  "https://dzkb.bayern/wp-content/uploads/2026/02/Bayern-Pfote.png";

function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Immer neutral antworten (kein Account-Leak)
  const neutralOk = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const ip = getClientIp(req);

    if (!email) return neutralOk();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: max 3 Requests / 15 Minuten pro E-Mail, zusätzlich max 6 / 15 Minuten pro IP
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { count: emailCount } = await supabase
      .from("access_code_request_log")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);

    let ipCount = 0;
    if (ip) {
      const { count } = await supabase
        .from("access_code_request_log")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      ipCount = count ?? 0;
    }

    // Versuch loggen (Audit)
    await supabase.from("access_code_request_log").insert({ email, ip });

    const blocked = (emailCount ?? 0) >= 3 || ipCount >= 6;
    if (blocked) return neutralOk();

    // Neuesten aktiven Code zur E-Mail finden
    const { data: codeRow } = await supabase
      .from("access_codes")
      .select("code, student_name, email, is_active, created_at")
      .eq("email", email)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeRow) return neutralOk();

    const appUrl = Deno.env.get("APP_URL") ?? "";
    const studentName = (codeRow.student_name ?? "").toString();

    const html = `
      <!doctype html>
      <html lang="de">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DZKB Prüfungstrainer – Zugangscode</title>
      </head>
      <body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:40px 12px;">

              <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="
                width:600px;
                background:#ffffff;
                border-radius:18px;
                box-shadow:0 8px 24px rgba(0,0,0,0.12);
                overflow:hidden;
              ">

                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="
                      background:${PRIMARY_BLUE};
                      border-radius:18px 18px 0 0;
                    ">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td align="left" style="vertical-align:middle;">
                                <img
                                  src="${LOGO_URL}"
                                  alt="DZKB e.V. Bayern"
                                  width="150"
                                  style="display:block;border:0;height:auto;"
                                />
                              </td>
                              <td align="right" style="vertical-align:middle;">
                                <img
                                  src="${PAW_URL}"
                                  alt="Bayern Pfote"
                                  width="48"
                                  style="display:block;border:0;height:auto;"
                                />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="height:6px;background:${PRIMARY_BLUE_DARK};"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 28px;color:#1a1a1a;">

                    <p style="font-size:20px;font-weight:700;margin:0 0 18px 0;">
                      Hallo ${studentName},
                    </p>

                    <p style="font-size:15px;line-height:1.6;margin:0 0 18px 0;">
                      dein persönlicher Zugangscode für den Prüfungstrainer lautet:
                    </p>

                    <div style="
                      display:inline-block;
                      background:#f5f7fa;
                      border:1px solid #dce1e8;
                      border-radius:14px;
                      padding:16px 20px;
                      font-size:18px;
                      font-weight:700;
                      letter-spacing:1px;
                      margin-bottom:24px;
                      user-select:all;
                    ">
                      ${codeRow.code}
                    </div>

                    <p style="font-size:15px;margin:0 0 26px 0;">
                      Hier kannst du dich einloggen:
                    </p>

                    <a href="${appUrl}" style="
                      display:inline-block;
                      background:${PRIMARY_BLUE};
                      color:#ffffff;
                      text-decoration:none;
                      font-size:15px;
                      font-weight:700;
                      padding:14px 26px;
                      border-radius:14px;
                    ">
                      Zum Prüfungstrainer
                    </a>

                    <p style="font-size:13px;color:#6b7280;margin:28px 0 0 0;">
                      Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
                    </p>

                  </td>
                </tr>

                <tr>
                  <td style="
                    background:#f7f8fa;
                    padding:18px 24px;
                    text-align:center;
                    font-size:12px;
                    color:#6b7280;
                    border-radius:0 0 18px 18px;
                  ">
                    DZKB Bayern e.V. ·
                    <a href="https://dzkb.bayern/impressum" style="color:#6b7280;">Impressum</a> ·
                    <a href="https://dzkb.bayern/datenschutz" style="color:#6b7280;">Datenschutz</a>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM"),
        to: codeRow.email,
        subject: "Dein Zugangscode für den DZKB Prüfungstrainer",
        html,
      }),
    });

    // Egal ob ok oder nicht: neutral antworten
    return neutralOk();
  } catch (_err) {
    return neutralOk();
  }
});
