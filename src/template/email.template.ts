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

      .code-box {
        font-family: 'Courier New', Courier, monospace;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 6px;
        color: #232f3e;
        background: #f7f8fa;
        border: 1px dashed #c9ccd1;
        padding: 14px 18px;
        border-radius: 8px;
        display: inline-block;
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
            <!-- Header -->
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

            <!-- Content -->
            <tr>
              <td class='content' style='padding: 40px 40px 10px 40px; color: #333333; font-size: 15px; line-height: 24px;'>
                <h2 style='margin: 0 0 14px 0; font-size: 20px; color: #232f3e;'>Yêu cầu đặt lại mật khẩu</h2>
                <p style='margin: 0 0 18px 0;'>{{content}}</p>

                <p style='margin: 0 0 10px 0; color: #555;'>Mã đặt lại mật khẩu của bạn:</p>
              </td>
            </tr>

            <!-- Reset Code -->
            <tr>
              <td align='center' style='padding: 0 40px 20px 40px;'>
                <div class='code-box'>{{resetCode}}</div>
              </td>
            </tr>

            <!-- Notes -->
            <tr>
              <td class='content' style='padding: 0 40px 30px 40px; color: #333333; font-size: 13px; line-height: 20px;'>
                <p style='margin: 0 0 10px 0; color: #666;'>
                  Mã này có hiệu lực trong <b>{{expireMinutes}} phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.
                </p>
                <p style='margin: 0; color: #666;'>
                  Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table width='600' cellpadding='0' cellspacing='0' border='0' style='width: 600px; max-width: 600px; margin-top: 20px;'>
            <tr>
              <td align='center' style='color: #7d818a; font-size: 11px; line-height: 16px; padding: 0 20px;'>
                <p>
                  PTH Services, Inc. là công ty con của PTH.com. Thông điệp này được soạn thảo và phân phối bởi PTH Services, Inc. hoặc các
                  <a href='#' style='color: #007eb9; text-decoration: none;'>công ty liên kết</a>.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;