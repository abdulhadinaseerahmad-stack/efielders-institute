<?php
/* =========================================================
   e-fielders member area: catalogue images
   ?f=t/NB-00791.webp | l/NB-00791-2.webp | charts/aa608fd0.webp
   Members get every image; visitors only the preview card images.
   The image folder itself is blocked by .htaccess, so this is the only way in.
   ========================================================= */
declare(strict_types=1);
require __DIR__ . '/lib.php';

$f = (string) ($_GET['f'] ?? '');
if (!preg_match('~^(t|l|charts)/(NB-\d+(?:-\d+)?|[0-9a-f]{8})\.webp$~', $f, $m)) {
    http_response_code(404);
    exit;
}

start_session(true);
$allowed = current_member() !== null;
if (!$allowed && $m[1] === 't') {
    $allowed = in_array($m[2], read_private('catalog.php', [])['preview'] ?? [], true);
}
if (!$allowed) {
    http_response_code(403);
    header('Cache-Control: no-store');
    exit;
}

$path = dirname(__DIR__) . '/assets/img/catalog/' . $f;
if (!is_file($path)) {
    http_response_code(404);
    exit;
}
header('Content-Type: image/webp');
header('Content-Length: ' . filesize($path));
// private: the browser may keep it, the CDN must not share it with visitors
header('Cache-Control: private, max-age=604800');
header('X-Content-Type-Options: nosniff');
readfile($path);
