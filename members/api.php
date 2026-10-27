<?php
/* =========================================================
   e-fielders member area: JSON API
     GET  ?action=status          who is signed in
     GET  ?action=catalog         full catalogue for members, preview for visitors
     POST ?action=login           {email, password}
     POST ?action=logout
     GET  ?action=members         admin: list members
     POST ?action=member_save     admin: {email, password, admin} add or reset
     POST ?action=member_remove   admin: {email}
   ========================================================= */
declare(strict_types=1);
require __DIR__ . '/lib.php';

const PREVIEW_FIELDS = ['s', 'n', 'm', 'c'];

$action = (string) ($_GET['action'] ?? '');
$isPost = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
$body = [];

if ($isPost) {
    // JSON only and same site only: a form on another website cannot post here
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== strtok($_SERVER['HTTP_HOST'] ?? '', ':')) {
        json_out(['error' => 'Not allowed.'], 403);
    }
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        json_out(['error' => 'Not allowed.'], 415);
    }
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) $body = [];
}

start_session(!$isPost);
$me = current_member();

function status_payload(?array $me): array
{
    return $me
        ? ['member' => true, 'email' => $me['email'], 'admin' => $me['admin'], 'csrf' => $_SESSION['csrf'] ?? '']
        : ['member' => false];
}

function require_admin(?array $me, array $body, bool $isPost): void
{
    if (!$me || !$me['admin']) json_out(['error' => 'Admins only.'], 403);
    if ($isPost && !hash_equals((string) ($_SESSION['csrf'] ?? ''), (string) ($body['csrf'] ?? ''))) {
        json_out(['error' => 'Your session expired. Please refresh the page.'], 403);
    }
}

switch ($action) {
    case 'status':
        json_out(status_payload($me));

    case 'catalog':
        $catalog = read_private('catalog.php', null);
        if (!$catalog) json_out(['error' => 'Catalogue not available.'], 500);
        if ($me) {
            json_out(status_payload($me) + ['order' => $catalog['order'], 'products' => $catalog['products']]);
        }
        // visitors: category counts and a few products, no prices or details
        $counts = [];
        foreach ($catalog['products'] as $p) $counts[$p['c']] = ($counts[$p['c']] ?? 0) + 1;
        $preview = [];
        foreach ($catalog['products'] as $p) {
            if (in_array($p['s'], $catalog['preview'], true)) {
                $preview[array_search($p['s'], $catalog['preview'], true)] = array_intersect_key($p, array_flip(PREVIEW_FIELDS));
            }
        }
        ksort($preview);
        json_out(['member' => false, 'total' => count($catalog['products']), 'order' => $catalog['order'],
            'counts' => $counts, 'products' => array_values($preview)]);

    case 'login':
        if (!$isPost) json_out(['error' => 'Use POST.'], 405);
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        if (login_blocked($email)) {
            json_out(['error' => 'Too many tries. Please wait 15 minutes and try again.'], 429);
        }
        $member = load_members()[$email] ?? null;
        if (!password_verify($password, $member['hash'] ?? DUMMY_HASH) || !$member) {
            note_login_failure($email);
            json_out(['error' => 'Email or password is not correct.'], 401);
        }
        session_regenerate_id(true);
        $_SESSION = [
            'email' => $email,
            'pv' => password_version($member['hash']),
            'csrf' => bin2hex(random_bytes(16)),
            'at' => time(),
        ];
        json_out(['ok' => true] + status_payload(current_member()));

    case 'logout':
        if (!$isPost) json_out(['error' => 'Use POST.'], 405);
        $_SESSION = [];
        session_destroy();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
        json_out(['ok' => true, 'member' => false]);

    case 'members':
        require_admin($me, $body, $isPost);
        $list = [];
        foreach (load_members() as $email => $m) {
            $list[] = ['email' => $email, 'admin' => !empty($m['admin']), 'created' => $m['created'] ?? ''];
        }
        usort($list, fn($a, $b) => strcmp($b['created'], $a['created']));
        json_out(['members' => $list]);

    case 'member_save':
        if (!$isPost) json_out(['error' => 'Use POST.'], 405);
        require_admin($me, $body, $isPost);
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['error' => 'Please enter a valid email.'], 422);
        if (strlen($password) < 8) json_out(['error' => 'Password must be at least 8 characters.'], 422);
        $makeAdmin = !empty($body['admin']) || $email === $me['email'];
        $isNew = false;
        update_private('users.php', ['users' => []], function (array $data) use ($email, $password, $makeAdmin, &$isNew) {
            $isNew = !isset($data['users'][$email]);
            $data['users'][$email] = [
                'hash' => password_hash($password, PASSWORD_BCRYPT),
                'admin' => $makeAdmin,
                'created' => $data['users'][$email]['created'] ?? gmdate('Y-m-d H:i'),
            ];
            return $data;
        });
        if ($email === $me['email']) $_SESSION['pv'] = password_version(load_members()[$email]['hash']);
        json_out(['ok' => true, 'created' => $isNew]);

    case 'member_remove':
        if (!$isPost) json_out(['error' => 'Use POST.'], 405);
        require_admin($me, $body, $isPost);
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if ($email === $me['email']) json_out(['error' => 'You cannot remove your own account.'], 422);
        update_private('users.php', ['users' => []], function (array $data) use ($email) {
            unset($data['users'][$email]);
            return $data;
        });
        json_out(['ok' => true]);

    default:
        json_out(['error' => 'Unknown action.'], 404);
}
