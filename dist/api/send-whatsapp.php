<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['phone']) || !isset($input['code'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Phone and code are required']);
    exit;
}

$phone = $input['phone'];
$code = $input['code'];

// TextMeBot API configuration
$apiKey = 'jYg9R67hoNMT';
$apiUrl = 'https://api.textmebot.com/send.php';

// Use your registered phone number
$registeredPhone = '6285890033683';

$message = "Kode verifikasi Temanly Anda: {$code}\n\nJangan bagikan kode ini kepada siapa pun.\n\nKode berlaku selama 10 menit.";

// Construct API URL
$url = $apiUrl . '?' . http_build_query([
    'recipient' => $registeredPhone,
    'apikey' => $apiKey,
    'text' => $message
]);

// Make API request
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 30,
        'user_agent' => 'Temanly-WhatsApp-Service/1.0'
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send WhatsApp message'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => "WhatsApp message sent to registered number: {$registeredPhone}",
    'response' => $response
]);
?>
