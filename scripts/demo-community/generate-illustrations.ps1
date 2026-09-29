# Draws the self-made demo illustrations and avatars (no third-party assets).
# Output: images\p1-flutter-app.jpg, p8-sprint-board.jpg, p9-profile-checklist.jpg,
#         p10-usdc-flow.jpg and avatars\*.png. Re-running overwrites them.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$images = Join-Path $here 'images'
$avatars = Join-Path $here 'avatars'
New-Item -ItemType Directory -Force $images, $avatars | Out-Null

function Color([string]$hex, [int]$alpha = 255) {
    $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
    [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B)
}
function Font([float]$size, [string]$style = 'Regular') {
    New-Object System.Drawing.Font('Segoe UI', $size, [System.Drawing.FontStyle]::$style, [System.Drawing.GraphicsUnit]::Pixel)
}
function Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.InterpolationMode = 'HighQualityBicubic'
    @($bmp, $g)
}
function Gradient($g, [int]$w, [int]$h, [string]$from, [string]$to) {
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, (Color $from), (Color $to), 35)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()
}
function RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90)
    $p.AddArc($x + $w - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
    $p.AddArc($x + $w - 2 * $r, $y + $h - 2 * $r, 2 * $r, 2 * $r, 0, 90)
    $p.AddArc($x, $y + $h - 2 * $r, 2 * $r, 2 * $r, 90, 90)
    $p.CloseFigure()
    $p
}
function FillRound($g, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r, [string]$hex, [int]$alpha = 255) {
    $path = RoundRect $x $y $w $h $r
    $brush = New-Object System.Drawing.SolidBrush((Color $hex $alpha))
    $g.FillPath($brush, $path)
    $brush.Dispose(); $path.Dispose()
}
function Text($g, [string]$text, [float]$size, [string]$hex, [float]$x, [float]$y, [string]$style = 'Regular', [float]$maxWidth = 0) {
    $font = Font $size $style
    $brush = New-Object System.Drawing.SolidBrush((Color $hex))
    if ($maxWidth -gt 0) {
        $g.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x, $y, $maxWidth, 400)))
    } else {
        $g.DrawString($text, $font, $brush, $x, $y)
    }
    $font.Dispose(); $brush.Dispose()
}
function SaveJpeg($bmp, [string]$path) {
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]86)
    $bmp.Save($path, $codec, $params)
}

# p1: Flutter app mockup for a shared-expense app
$bmp, $g = Canvas 1280 853
Gradient $g 1280 853 '#0B1B33' '#12406B'
FillRound $g 150 60 380 740 48 '#05101F'
FillRound $g 166 76 348 708 36 '#F4F7FB'
Text $g '9:41' 18 '#0F172A' 196 92 'Bold'
Text $g 'Nhóm Freelance Đà Lạt' 24 '#0F172A' 192 132 'Bold'
Text $g 'Chuyến công tác · 4 thành viên' 16 '#64748B' 192 166
FillRound $g 190 206 300 132 22 '#1D4ED8'
Text $g 'Tổng chi của nhóm' 16 '#BFDBFE' 212 224
Text $g '4.860.000 đ' 34 '#FFFFFF' 212 250 'Bold'
Text $g 'Bạn cần nhận lại 320.000 đ' 15 '#DBEAFE' 212 300
$rows = @(@('Vé xe khứ hồi', 'Lan · 1.200.000 đ', '#F59E0B'), @('Homestay 2 đêm', 'Vinh · 2.100.000 đ', '#10B981'), @('Ăn tối nhóm', 'Hà · 860.000 đ', '#EC4899'), @('Cà phê làm việc', 'Khoa · 700.000 đ', '#8B5CF6'))
$y = 362
foreach ($row in $rows) {
    FillRound $g 190 $y 300 76 18 '#FFFFFF'
    FillRound $g 206 ($y + 18) 40 40 20 $row[2]
    Text $g $row[0] 18 '#0F172A' 260 ($y + 14) 'Bold'
    Text $g $row[1] 15 '#64748B' 260 ($y + 42)
    $y += 88
}
FillRound $g 190 724 300 44 22 '#0F172A'
Text $g '+  Thêm khoản chi' 17 '#FFFFFF' 268 734 'Bold'
Text $g 'Flutter MVP' 64 '#FFFFFF' 610 250 'Bold'
Text $g 'Chia tiền nhóm, chạy offline,' 30 '#CBD5E1' 614 346
Text $g 'đồng bộ khi có mạng.' 30 '#CBD5E1' 614 388
$tags = @('Flutter', 'Riverpod', 'Drift', 'Offline-first')
$x = 614
foreach ($tag in $tags) {
    $width = 40 + 13 * $tag.Length
    FillRound $g $x 470 $width 46 23 '#FFFFFF' 36
    Text $g $tag 19 '#FFFFFF' ($x + 20) 480 'Bold'
    $x += $width + 14
}
SaveJpeg $bmp (Join-Path $images 'p1-flutter-app.jpg'); $g.Dispose(); $bmp.Dispose()

# p8: sprint board for the same app
$bmp, $g = Canvas 1280 853
Gradient $g 1280 853 '#F8FAFC' '#E2E8F0'
Text $g 'Sprint 3 · App chia tiền nhóm' 38 '#0F172A' 64 48 'Bold'
Text $g 'Cập nhật cuối tuần' 22 '#475569' 66 104
FillRound $g 64 150 1152 22 11 '#CBD5E1'
FillRound $g 64 150 783 22 11 '#2563EB'
Text $g '68% hoàn thành' 20 '#1E3A8A' 1040 180 'Bold'
$columns = @(
    @('Cần làm', '#F59E0B', @('Xuất báo cáo PDF', 'Nhắc nợ qua thông báo')),
    @('Đang làm', '#3B82F6', @('Đồng bộ khi mất mạng', 'Chia theo tỉ lệ %')),
    @('Hoàn thành', '#10B981', @('Tạo nhóm & mời bạn', 'Nhập khoản chi nhanh', 'Tính số dư từng người', 'Giao diện tối'))
)
$x = 64
foreach ($col in $columns) {
    FillRound $g $x 230 360 580 24 '#FFFFFF'
    FillRound $g ($x + 24) 256 14 14 7 $col[1]
    Text $g $col[0] 24 '#0F172A' ($x + 48) 244 'Bold'
    $y = 300
    foreach ($card in $col[2]) {
        FillRound $g ($x + 20) $y 320 96 16 '#F1F5F9'
        FillRound $g ($x + 20) $y 8 96 4 $col[1]
        Text $g $card 20 '#0F172A' ($x + 44) ($y + 20) 'Bold'
        Text $g 'Nova · Mobile' 16 '#64748B' ($x + 44) ($y + 56)
        $y += 112
    }
    $x += 396
}
SaveJpeg $bmp (Join-Path $images 'p8-sprint-board.jpg'); $g.Dispose(); $bmp.Dispose()

# p9: profile checklist for job seekers
$bmp, $g = Canvas 1280 853
Gradient $g 1280 853 '#FFF7ED' '#FDE68A'
FillRound $g 120 90 520 673 32 '#FFFFFF'
FillRound $g 170 140 110 110 55 '#F97316'
Text $g 'HS' 44 '#FFFFFF' 190 164 'Bold'
Text $g 'Hồ sơ freelancer' 30 '#0F172A' 300 150 'Bold'
Text $g 'Checklist trước khi ứng tuyển' 20 '#64748B' 302 196
$items = @('Tiêu đề nói rõ bạn làm gì', 'Ba dự án tiêu biểu có kết quả', 'Kỹ năng khớp với tin tuyển', 'Ảnh đại diện rõ mặt, nền gọn', 'Lời nhắn riêng cho từng job', 'Phản hồi trong 24 giờ')
$y = 290
$i = 0
foreach ($item in $items) {
    $done = $i -lt 4
    FillRound $g 170 $y 38 38 10 ($(if ($done) { '#10B981' } else { '#E2E8F0' }))
    if ($done) { Text $g ([string][char]0x2713) 26 '#FFFFFF' 178 ($y + 1) 'Bold' }
    Text $g $item 21 '#1E293B' 226 ($y + 4)
    $y += 72
    $i++
}
Text $g 'Hoàn thiện hồ sơ,' 58 '#7C2D12' 700 300 'Bold'
Text $g 'rồi mới ứng tuyển.' 58 '#7C2D12' 700 372 'Bold'
Text $g 'Doanh nghiệp đọc hồ sơ trước khi đọc lời chào.' 24 '#9A3412' 704 470 'Regular' 480
SaveJpeg $bmp (Join-Path $images 'p9-profile-checklist.jpg'); $g.Dispose(); $bmp.Dispose()

# p10: USDC payment flow on Solana Devnet
$bmp, $g = Canvas 1280 853
Gradient $g 1280 853 '#0F0A2E' '#1E1B4B'
Text $g 'Thanh toán USDC trên Solana Devnet' 40 '#FFFFFF' 70 60 'Bold'
Text $g 'Luồng thử nghiệm trong Nova · tiền Devnet không có giá trị thật' 22 '#C4B5FD' 72 118
$steps = @(
    @('1', 'Hóa đơn', 'Doanh nghiệp tạo', '#8B5CF6'),
    @('2', 'Yêu cầu thanh toán', 'Số tiền, ví nhận, mã tham chiếu', '#6366F1'),
    @('3', 'Ký giao dịch', 'Người trả ký bằng ví riêng', '#0EA5E9'),
    @('4', 'Xác nhận', 'confirmed rồi finalized', '#14B8A6')
)
$x = 70
foreach ($step in $steps) {
    FillRound $g $x 250 250 300 28 '#FFFFFF' 22
    FillRound $g ($x + 24) 276 64 64 32 $step[3]
    Text $g $step[0] 32 '#FFFFFF' ($x + 44) 286 'Bold'
    Text $g $step[1] 24 '#FFFFFF' ($x + 24) 366 'Bold' 210
    Text $g $step[2] 18 '#DDD6FE' ($x + 24) 440 'Regular' 210
    if ($x -lt 900) {
        $pen = New-Object System.Drawing.Pen((Color '#A78BFA'), 5)
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
        $g.DrawLine($pen, ($x + 258), 400, ($x + 292), 400)
        $pen.Dispose()
    }
    $x += 290
}
FillRound $g 70 620 1140 150 28 '#FFFFFF' 16
Text $g 'USDC' 44 '#FFFFFF' 110 650 'Bold'
Text $g 'Chỉ khi giao dịch đạt finalized, hóa đơn mới chuyển sang Đã thanh toán.' 24 '#E9D5FF' 290 660 'Regular' 880
Text $g 'Mỗi chữ ký giao dịch chỉ được ghi nhận một lần.' 24 '#E9D5FF' 290 706
SaveJpeg $bmp (Join-Path $images 'p10-usdc-flow.jpg'); $g.Dispose(); $bmp.Dispose()

# Avatars: initials on distinct gradients (no photos of real people)
$people = @(
    @('nova-demo-thu-ha', 'TH', '#2563EB', '#38BDF8'),
    @('nova-demo-quang-vinh', 'QV', '#7C3AED', '#C084FC'),
    @('nova-demo-ngoc-mai', 'NM', '#DB2777', '#F9A8D4'),
    @('nova-demo-duc-khoa', 'ĐK', '#0F766E', '#5EEAD4'),
    @('nova-demo-bao-chau', 'BC', '#EA580C', '#FDBA74'),
    @('nova-demo-hai-nam', 'HN', '#4338CA', '#818CF8'),
    @('nova-demo-kim-ngan', 'KN', '#BE123C', '#FDA4AF'),
    @('nova-demo-tien-dat', 'TĐ', '#15803D', '#86EFAC'),
    @('nova-demo-phuong-linh', 'PL', '#A16207', '#FDE047'),
    @('nova-demo-hoang-phuc', 'HP', '#0369A1', '#7DD3FC')
)
foreach ($p in $people) {
    $bmp, $g = Canvas 256 256
    $g.Clear([System.Drawing.Color]::Transparent)
    $rect = New-Object System.Drawing.Rectangle(0, 0, 256, 256)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, (Color $p[2]), (Color $p[3]), 45)
    $g.FillEllipse($brush, $rect)
    $brush.Dispose()
    $font = Font 96 'Bold'
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = 'Center'; $format.LineAlignment = 'Center'
    $g.DrawString($p[1], $font, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 4, 256, 256)), $format)
    $font.Dispose()
    $bmp.Save((Join-Path $avatars "$($p[0]).png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}
'Illustrations and avatars written.'
