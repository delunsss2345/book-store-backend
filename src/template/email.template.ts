export const EMAIL_TEMPLATE = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>PTH Account Active</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f2f3f5;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      table {
        border-spacing: 0;
        border-collapse: collapse;
      }
      img {
        border: 0;
      }

      .ExternalClass {
        width: 100%;
      }
      .ExternalClass,
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
      }

      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
        }
        .content {
          padding: 20px !important;
        }
      }
    </style>
  </head>
  <body style='margin: 0; padding: 0; background-color: #f2f3f5;'>

    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: #f2f3f5; padding: 20px 0;'>
      <tr>
        <td align='center'>

          <table
            class='container'
            width='600'
            cellpadding='0'
            cellspacing='0'
            border='0'
            style='background-color: #ffffff; width: 600px; max-width: 600px; border: 1px solid #dddddd;'
          >

            <tr>
              <td align='center' style='background-color: #232f3e; padding: 25px;'>
                <table cellpadding='0' cellspacing='0' border='0'>
                  <tr>
                    <td align='center'>
                      <div
                        style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 34px; font-weight: 900; color: #ffffff; line-height: 1; letter-spacing: 1px;"
                      >
                        PTH
                      </div>
                      <div
                        style='width: 70px; height: 12px; margin: -6px auto 0 auto; border: solid 4px #ff9900; border-color: transparent transparent #ff9900 transparent; border-radius: 0 0 50% 50%;'
                      ></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                class='content'
                style='padding: 40px 40px 20px 40px; color: #333333; font-size: 15px; line-height: 24px;'
              >

                <p style='margin: 0 0 20px 0;'>{{content}}
                </p>
              </td>
            </tr>

            <tr>
              <td align='center' style='padding: 0 40px 40px 40px;'>
                <table cellpadding='0' cellspacing='0' border='0'>
                  <tr>
                    <td align='center' style='background-color: #232f3e; border-radius: 4px;'>
                      <a
                        href='{{link}}'
                        style='display: inline-block; padding: 12px 24px; font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;'
                      >{{textLink}}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          <table
            width='600'
            cellpadding='0'
            cellspacing='0'
            border='0'
            style='width: 600px; max-width: 600px; margin-top: 20px;'
          >
            <tr>
              <td align='center' style='color: #7d818a; font-size: 11px; line-height: 16px; padding: 0 20px;'>
                <p>PTH Services, Inc. là công ty con của PTH.com. Thông điệp này được soạn thảo và phân phối bởi PTH
                  Services, Inc. hoặc các
                  <a href='#' style='color: #007eb9; text-decoration: none;'>công ty liên kết</a></p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>`;

export const EMAIL_TEMPLATE_RESET_PASSWORD = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Reset Password</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f2f3f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
      table { border-spacing: 0; border-collapse: collapse; }
      .container { width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #dddddd; }
      .button-container { padding: 20px 0; }
      .btn {
        background-color: #ff9900;
        border-radius: 4px;
        color: #ffffff !important;
        display: inline-block;
        font-size: 16px;
        font-weight: bold;
        padding: 14px 30px;
        text-decoration: none;
        text-align: center;
      }
      .link-fallback {
        font-size: 12px;
        color: #888888;
        word-break: break-all;
        margin-top: 20px;
      }
      @media screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .content { padding: 25px !important; }
      }
    </style>
  </head>

  <body style='margin: 0; padding: 0; background-color: #f2f3f5;'>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: #f2f3f5; padding: 20px 0;'>
      <tr>
        <td align='center'>
          <table class='container' cellpadding='0' cellspacing='0' border='0'>
            <tr>
              <td align='center' style='background-color: #232f3e; padding: 25px;'>
                <div style="font-size: 34px; font-weight: 900; color: #ffffff; line-height: 1; letter-spacing: 1px;">
                  PTH
                </div>
                <div style='width: 70px; height: 12px; margin: -6px auto 0 auto; border: solid 4px #ff9900; border-color: transparent transparent #ff9900 transparent; border-radius: 0 0 50% 50%;'></div>
              </td>
            </tr>

            <tr>
              <td class='content' style='padding: 40px; color: #333333; font-size: 15px; line-height: 24px;'>
                <h2 style='margin: 0 0 14px 0; font-size: 20px; color: #232f3e;'>Thiết lập mật khẩu mới</h2>
                <p style='margin: 0 0 18px 0;'>{{content}}</p>
                <p style='margin: 0;'>Vui lòng nhấn vào nút bên dưới để tiến hành thay đổi mật khẩu cho tài khoản của bạn:</p>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0" class="button-container">
                  <tr>
                    <td align="center">
                      <a href="{{resetLink}}" target="_blank" class="btn">Đổi mật khẩu</a>
                    </td>
                  </tr>
                </table>

                <p style='margin: 20px 0 10px 0; color: #666; font-size: 13px;'>
                  Liên kết này có hiệu lực trong <b>{{expireMinutes}} phút</b>. Vì lý do bảo mật, vui lòng không chia sẻ liên kết này với bất kỳ ai.
                </p>

                <div class="link-fallback">
                  Hoặc copy đường dẫn này nếu nút không hoạt động: <br/>
                  <a href="{{resetLink}}" style="color: #007eb9;">{{resetLink}}</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style='padding: 0 40px 30px 40px; color: #999; font-size: 12px;'>
                Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn tạo mật khẩu mới.
              </td>
            </tr>
          </table>

          <table width='600' style='width: 600px; max-width: 600px; margin-top: 20px;'>
            <tr>
              <td align='center' style='color: #7d818a; font-size: 11px; padding: 0 20px;'>
                <p>© PTH Services, Inc. | <a href='#' style='color: #007eb9; text-decoration: none;'>Điều khoản sử dụng</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;



export const EMAIL_TEMPLATE_ORDER_SUCCESS = `<html>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Order Confirmation</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f2f3f5;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      table {
        border-spacing: 0;
        border-collapse: collapse;
      }
      .container {
        width: 600px;
        max-width: 600px;
        background-color: #ffffff;
        border: 1px solid #dddddd;
      }
      .content {
        padding: 40px;
        color: #333333;
        font-size: 15px;
        line-height: 24px;
      }
      .info-box {
        margin-top: 20px;
        padding: 16px;
        background-color: #f7f7f7;
        border-radius: 4px;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      @media screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .content { padding: 20px !important; }
      }
    </style>
  </head>

  <body>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='padding: 20px 0;'>
      <tr>
        <td align='center'>

          <table class='container'>
            <tr>
              <td align='center' style='background-color: #232f3e; padding: 25px;'>
                <div style="font-size: 34px; font-weight: 900; color: #ffffff;">
                  PTH
                </div>
              </td>
            </tr>

            <tr>
              <td class='content'>
                <h2 style='margin: 0 0 16px 0; color: #232f3e;'>Cảm ơn bạn đã đặt hàng 🎉</h2>

                <p>Xin chào <b>{{email}}</b>,</p>

                <p>Cảm ơn bạn đã tin tưởng và đặt hàng tại hệ thống của chúng tôi. Dưới đây là thông tin đơn hàng của bạn:</p>

                <div class="info-box">
                  <p><span class="label">Order Code:</span> {{orderCode}}</p>
                  <p><span class="label">Order ID:</span> {{orderId}}</p>
                  <p><span class="label">Trạng thái:</span> {{orderStatus}}</p>
                </div>

                <p style='margin-top: 20px;'>
                  Chúng tôi sẽ tiếp tục xử lý đơn hàng và cập nhật trạng thái cho bạn trong thời gian sớm nhất.
                </p>

                <p>Trân trọng,<br/>PTH Team</p>
              </td>
            </tr>
          </table>

          <table width='600' style='margin-top: 20px;'>
            <tr>
              <td align='center' style='font-size: 11px; color: #7d818a;'>
                © PTH Services, Inc.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;