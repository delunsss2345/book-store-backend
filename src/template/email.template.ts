/* ─── Claude-inspired colour tokens ──────────────────────────────────────
   --bg:        #FAF8F5   warm cream outer background
   --card:      #FFFFFF   card surface
   --header:    #1F1C19   deep warm-charcoal header
   --accent:    #D97757   claude orange-coral
   --accent-dk: #B85E3E   darker shade for hover text
   --text:      #1A1816   primary text
   --muted:     #6B6560   secondary / helper text
   --border:    #EAE5DC   warm border
──────────────────────────────────────────────────────────────────────── */

export const EMAIL_TEMPLATE = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>PTH – Kích hoạt tài khoản</title>
    <style>
      body { margin:0; padding:0; background-color:#FAF8F5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
      table { border-spacing:0; border-collapse:collapse; }
      img { border:0; }
      .wrap { background-color:#FAF8F5; padding:32px 0 48px; }
      .card { background-color:#ffffff; width:600px; max-width:600px; border:1px solid #EAE5DC; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); }
      .header { background-color:#1F1C19; padding:30px 40px; }
      .logo-text { font-size:28px; font-weight:900; color:#ffffff; letter-spacing:1.5px; line-height:1; }
      .logo-bar { width:44px; height:3px; background:#D97757; border-radius:2px; margin-top:8px; }
      .body-cell { padding:40px 40px 24px; color:#1A1816; font-size:15px; line-height:26px; }
      .divider { height:1px; background:#EAE5DC; margin:24px 0; }
      .btn-wrap { padding:4px 40px 40px; }
      .btn {
        display:inline-block;
        background-color:#D97757;
        color:#ffffff !important;
        text-decoration:none;
        font-size:15px;
        font-weight:700;
        padding:13px 28px;
        border-radius:6px;
        letter-spacing:.3px;
      }
      .footer-cell { padding:0 24px 20px; text-align:center; color:#6B6560; font-size:11px; line-height:18px; }
      .footer-cell a { color:#D97757; text-decoration:none; }
      @media screen and (max-width:640px){
        .card  { width:100%!important; border-radius:0!important; }
        .body-cell, .btn-wrap { padding-left:24px!important; padding-right:24px!important; }
        .header { padding:24px!important; }
      }
    </style>
  </head>
  <body>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' class='wrap'>
      <tr>
        <td align='center'>

          <!-- Card -->
          <table class='card' cellpadding='0' cellspacing='0' border='0'>

            <!-- Header -->
            <tr>
              <td class='header'>
                <div class='logo-text'>PTH</div>
                <div class='logo-bar'></div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class='body-cell'>
                <p style='margin:0 0 16px;'>{{content}}</p>
                <div class='divider'></div>
                <p style='margin:0; color:#6B6560; font-size:13px;'>
                  Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này một cách an toàn.
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td class='btn-wrap'>
                <a href='{{link}}' class='btn'>{{textLink}}</a>
              </td>
            </tr>

          </table>
          <!-- /Card -->

          <!-- Footer -->
          <table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px; margin-top:20px;'>
            <tr>
              <td class='footer-cell'>
                <p style='margin:0;'>
                  PTH Services, Inc. — công ty con của PTH.com.<br/>
                  <a href='#'>Điều khoản</a> &nbsp;·&nbsp; <a href='#'>Chính sách bảo mật</a>
                </p>
              </td>
            </tr>
          </table>
          <!-- /Footer -->

        </td>
      </tr>
    </table>
  </body>
</html>`;

export const EMAIL_TEMPLATE_RESET_PASSWORD = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>PTH – Đặt lại mật khẩu</title>
    <style>
      body { margin:0; padding:0; background-color:#FAF8F5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
      table { border-spacing:0; border-collapse:collapse; }
      .wrap { background-color:#FAF8F5; padding:32px 0 48px; }
      .card { background-color:#ffffff; width:600px; max-width:600px; border:1px solid #EAE5DC; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); }
      .header { background-color:#1F1C19; padding:30px 40px; }
      .logo-text { font-size:28px; font-weight:900; color:#ffffff; letter-spacing:1.5px; line-height:1; }
      .logo-bar { width:44px; height:3px; background:#D97757; border-radius:2px; margin-top:8px; }
      .body-cell { padding:40px 40px 0; color:#1A1816; font-size:15px; line-height:26px; }
      .heading { margin:0 0 18px; font-size:22px; font-weight:800; color:#1F1C19; }
      .notice-box {
        margin:24px 0;
        padding:14px 18px;
        background-color:#FDF4F0;
        border-left:4px solid #D97757;
        border-radius:4px;
        color:#5A3320;
        font-size:13px;
        line-height:22px;
      }
      .btn {
        display:inline-block;
        background-color:#D97757;
        color:#ffffff !important;
        text-decoration:none;
        font-size:15px;
        font-weight:700;
        padding:14px 32px;
        border-radius:6px;
        letter-spacing:.3px;
      }
      .btn-wrap { padding:28px 40px 0; }
      .fallback { margin:24px 0 0; font-size:12px; color:#6B6560; word-break:break-all; }
      .fallback a { color:#D97757; text-decoration:none; }
      .security-note { padding:24px 40px 32px; font-size:12px; color:#6B6560; line-height:20px; border-top:1px solid #EAE5DC; margin-top:32px; }
      .footer-cell { padding:0 24px 20px; text-align:center; color:#6B6560; font-size:11px; line-height:18px; }
      .footer-cell a { color:#D97757; text-decoration:none; }
      @media screen and (max-width:640px){
        .card { width:100%!important; border-radius:0!important; }
        .body-cell,.btn-wrap,.security-note { padding-left:24px!important; padding-right:24px!important; }
        .header { padding:24px!important; }
      }
    </style>
  </head>
  <body>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' class='wrap'>
      <tr>
        <td align='center'>

          <!-- Card -->
          <table class='card' cellpadding='0' cellspacing='0' border='0'>

            <!-- Header -->
            <tr>
              <td class='header'>
                <div class='logo-text'>PTH</div>
                <div class='logo-bar'></div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class='body-cell'>
                <h2 class='heading'>Thiết lập mật khẩu mới</h2>
                <p style='margin:0 0 16px;'>{{content}}</p>
                <p style='margin:0;'>Vui lòng nhấn vào nút bên dưới để tiến hành thay đổi mật khẩu:</p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td class='btn-wrap'>
                <a href='{{resetLink}}' target='_blank' class='btn'>Đổi mật khẩu ngay</a>
              </td>
            </tr>

            <!-- Notice + fallback -->
            <tr>
              <td style='padding:24px 40px 0;'>
                <div class='notice-box'>
                  Liên kết có hiệu lực trong <b>{{expireMinutes}} phút</b>.
                  Vì lý do bảo mật, vui lòng không chia sẻ liên kết này.
                </div>
                <p class='fallback'>
                  Nếu nút không hoạt động, copy đường dẫn sau:<br/>
                  <a href='{{resetLink}}'>{{resetLink}}</a>
                </p>
              </td>
            </tr>

            <!-- Security note -->
            <tr>
              <td class='security-note'>
                Nếu bạn không gửi yêu cầu này, bạn có thể bỏ qua email này.
                Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn tạo mật khẩu mới.
              </td>
            </tr>

          </table>
          <!-- /Card -->

          <!-- Footer -->
          <table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px; margin-top:20px;'>
            <tr>
              <td class='footer-cell'>
                <p style='margin:0;'>
                  © PTH Services, Inc. &nbsp;·&nbsp;
                  <a href='#'>Điều khoản</a> &nbsp;·&nbsp; <a href='#'>Chính sách bảo mật</a>
                </p>
              </td>
            </tr>
          </table>
          <!-- /Footer -->

        </td>
      </tr>
    </table>
  </body>
</html>`;

export const EMAIL_TEMPLATE_ORDER_SUCCESS = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>PTH – Xác nhận đơn hàng</title>
    <style>
      body { margin:0; padding:0; background-color:#FAF8F5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
      table { border-spacing:0; border-collapse:collapse; }
      .wrap { background-color:#FAF8F5; padding:32px 0 48px; }
      .card { background-color:#ffffff; width:600px; max-width:600px; border:1px solid #EAE5DC; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.06); }
      .header { background-color:#1F1C19; padding:30px 40px; }
      .logo-text { font-size:28px; font-weight:900; color:#ffffff; letter-spacing:1.5px; line-height:1; }
      .logo-bar { width:44px; height:3px; background:#D97757; border-radius:2px; margin-top:8px; }
      .banner {
        background: linear-gradient(135deg, #2C2420 0%, #3D2E27 100%);
        padding:28px 40px;
        border-bottom:1px solid #EAE5DC;
      }
      .banner-title { font-size:20px; font-weight:800; color:#ffffff; margin:0 0 6px; }
      .banner-sub { font-size:13px; color:#C9A98A; margin:0; }
      .body-cell { padding:36px 40px 24px; color:#1A1816; font-size:15px; line-height:26px; }
      .info-card {
        background-color:#FAF8F5;
        border:1px solid #EAE5DC;
        border-radius:6px;
        padding:20px 22px;
        margin:20px 0 0;
      }
      .info-row { display:table; width:100%; margin-bottom:12px; }
      .info-row:last-child { margin-bottom:0; }
      .info-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#6B6560; margin:0 0 3px; }
      .info-value { font-size:15px; color:#1A1816; font-weight:600; margin:0; }
      .badge {
        display:inline-block;
        background-color:#FDF4F0;
        color:#D97757;
        font-size:12px;
        font-weight:700;
        padding:3px 10px;
        border-radius:20px;
        border:1px solid #F0C9B5;
      }
      .divider { height:1px; background:#EAE5DC; margin:24px 0; }
      .footer-cell { padding:0 24px 20px; text-align:center; color:#6B6560; font-size:11px; line-height:18px; }
      .footer-cell a { color:#D97757; text-decoration:none; }
      @media screen and (max-width:640px){
        .card { width:100%!important; border-radius:0!important; }
        .body-cell { padding-left:24px!important; padding-right:24px!important; }
        .header, .banner { padding-left:24px!important; padding-right:24px!important; }
      }
    </style>
  </head>
  <body>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' class='wrap'>
      <tr>
        <td align='center'>

          <!-- Card -->
          <table class='card' cellpadding='0' cellspacing='0' border='0'>

            <!-- Header -->
            <tr>
              <td class='header'>
                <div class='logo-text'>PTH</div>
                <div class='logo-bar'></div>
              </td>
            </tr>

            <!-- Confirmation banner -->
            <tr>
              <td class='banner'>
                <p class='banner-title'>Đơn hàng đã được xác nhận ✓</p>
                <p class='banner-sub'>Chúng tôi đã nhận và đang xử lý đơn hàng của bạn.</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class='body-cell'>
                <p style='margin:0 0 12px;'>Xin chào <b>{{email}}</b>,</p>
                <p style='margin:0;'>
                  Cảm ơn bạn đã đặt hàng tại PTH! Dưới đây là thông tin chi tiết đơn hàng của bạn:
                </p>

                <!-- Info card -->
                <div class='info-card'>
                  <table width='100%' cellpadding='0' cellspacing='0' border='0'>
                    <tr>
                      <td style='padding:0 0 14px; border-bottom:1px solid #EAE5DC;'>
                        <p class='info-label'>Mã đơn hàng</p>
                        <p class='info-value'>{{orderCode}}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style='padding:14px 0; border-bottom:1px solid #EAE5DC;'>
                        <p class='info-label'>Order ID</p>
                        <p class='info-value' style='font-size:13px; color:#6B6560; font-weight:400;'>{{orderId}}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style='padding:14px 0 0;'>
                        <p class='info-label'>Trạng thái</p>
                        <span class='badge'>{{orderStatus}}</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class='divider'></div>

                <p style='margin:0; color:#6B6560; font-size:13px;'>
                  Chúng tôi sẽ cập nhật trạng thái đơn hàng và thông báo cho bạn qua email.<br/>
                  Trân trọng — <b>PTH Team</b>
                </p>
              </td>
            </tr>

          </table>
          <!-- /Card -->

          <!-- Footer -->
          <table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px; margin-top:20px;'>
            <tr>
              <td class='footer-cell'>
                <p style='margin:0;'>
                  © PTH Services, Inc. &nbsp;·&nbsp;
                  <a href='#'>Điều khoản</a> &nbsp;·&nbsp; <a href='#'>Chính sách bảo mật</a>
                </p>
              </td>
            </tr>
          </table>
          <!-- /Footer -->

        </td>
      </tr>
    </table>
  </body>
</html>`;
