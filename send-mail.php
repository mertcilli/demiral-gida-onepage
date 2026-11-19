<?php
header('Content-Type: application/json; charset=utf-8');

function reply($ok, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(false, 'Geçersiz istek yöntemi.', 405);
}

// Honeypot: botlar bu gizli alanı doldurur; sessizce başarılı dön.
if (!empty($_POST['website'])) {
    reply(true, 'Mesajınız alındı. Teşekkür ederiz.');
}

function clean($v) {
    return trim(str_replace(["\r", "\n"], ' ', strip_tags((string)$v)));
}

$name    = clean($_POST['name'] ?? '');
$company = clean($_POST['company'] ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone   = clean($_POST['phone'] ?? '');
$subject = clean($_POST['subject'] ?? '');
$message = trim(strip_tags((string)($_POST['message'] ?? '')));

if ($name === '' || !$email || $message === '') {
    reply(false, 'Lütfen ad soyad, geçerli e-posta ve mesaj alanlarını doldurun.', 400);
}
if (!isset($_POST['kvkk'])) {
    reply(false, 'Devam etmek için KVKK onayını işaretlemelisiniz.', 400);
}
if (mb_strlen($message) > 5000) {
    reply(false, 'Mesaj çok uzun.', 400);
}

$to = 'info@demiral.com.tr';
$mailSubject = '=?UTF-8?B?' . base64_encode('Web İletişim Formu - ' . ($subject ?: $name)) . '?=';

$body  = "Ad Soyad: {$name}\n";
$body .= "Firma: {$company}\n";
$body .= "E-posta: {$email}\n";
$body .= "Telefon: {$phone}\n";
$body .= "Konu: {$subject}\n\n";
$body .= "Mesaj:\n{$message}\n";

$host = preg_replace('/[^a-z0-9.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$headers  = "From: Demiral Gıda Web <no-reply@{$host}>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (@mail($to, $mailSubject, $body, $headers)) {
    reply(true, 'Mesajınız alındı. En kısa sürede dönüş yapacağız.');
}
reply(false, 'Mesaj şu anda gönderilemedi. Lütfen info@demiral.com.tr adresine yazın.', 500);
