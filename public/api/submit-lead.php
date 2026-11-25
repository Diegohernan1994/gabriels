<?php
// GoDaddy / Apache PHP Proxy for Gabriel's Auto Service (GHL / CRM Webhook)
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Inverted Base64 chunks (replace [] with generated chunks once GHL Inbound Webhook URL is ready)
$_p = [];
$envWebhook = getenv('GHL_WEBHOOK_URL');
$targetWebhook = $envWebhook ? $envWebhook : (!empty($_p) ? base64_decode(implode('', array_reverse($_p))) : '');

$tz = new DateTimeZone('America/Los_Angeles');
$now = new DateTime('now', $tz);

$payload = array_merge($data, [
    'Interest' => trim((string)($data['Interest'] ?? $data['interest'] ?? '')),
    'Url' => trim((string)($data['Url'] ?? $data['url'] ?? ($_SERVER['HTTP_REFERER'] ?? ''))),
    'Title' => trim((string)($data['Title'] ?? $data['title'] ?? '')),
    'submission_date_time' => $now->format('n/j/Y, g:i:s A') . ' (PT)',
    'submission_date_iso' => gmdate('Y-m-d\TH:i:s.000\Z'),
    'client_ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
]);

// Local backup log so no lead is ever lost
$logEntry = '[' . $payload['submission_date_iso'] . '] ' . json_encode($payload) . PHP_EOL;
@file_put_contents(__DIR__ . '/leads_backup.log', $logEntry, FILE_APPEND | LOCK_EX);

if (empty($targetWebhook)) {
    echo json_encode(['success' => false, 'mode' => 'preview']);
    exit;
}

$ch = curl_init($targetWebhook);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 10,
]);

curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode(['success' => $httpCode >= 200 && $httpCode < 300]);
