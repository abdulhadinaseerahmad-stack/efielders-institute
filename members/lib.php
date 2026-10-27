<?php
/* =========================================================
   e-fielders member area: shared helpers
   Sessions, member accounts and private data files.

   Private files live in members/data/ (blocked by .htaccess) and start with
   a PHP guard line, so even if that block ever fails, opening one in a
   browser returns 404 instead of the content.
   ========================================================= */
declare(strict_types=1);

const DATA_DIR = __DIR__ . '/data';
const GUARD_LINE = "<?php http_response_code(404); exit; ?>\n";
const SESSION_DAYS = 30;
// failed logins allowed per 15 minutes, per email and per visitor
const LOGIN_WINDOW = 900;
const LOGIN_LIMIT_EMAIL = 10;
const LOGIN_LIMIT_CLIENT = 30;
// compared against when an email is unknown, so both cases take the same time
const DUMMY_HASH = '$2y$10$463.sGqZwJXtIY2LfHoqSOT3Ulr8lgVu4hGbLpisLgJ8.LnkLiBVm';

/* ---------- Private data files ---------- */
function read_private(string $file, $default)
{
    $path = DATA_DIR . '/' . $file;
    if (!is_file($path)) return $default;
    $raw = (string) file_get_contents($path);
    $data = json_decode(substr($raw, strpos($raw, "\n") + 1), true);
    return is_array($data) ? $data : $default;
}

function write_private(string $file, array $data): void
{
    $path = DATA_DIR . '/' . $file;
    $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    file_put_contents($tmp, GUARD_LINE . $json, LOCK_EX);
    rename($tmp, $path);
}

// read-modify-write under a lock so parallel requests do not lose updates
function update_private(string $file, array $default, callable $change): array
{
    $lock = fopen(DATA_DIR . '/' . $file . '.lock', 'c');
    flock($lock, LOCK_EX);
    $data = $change(read_private($file, $default));
    write_private($file, $data);
    flock($lock, LOCK_UN);
    fclose($lock);
    return $data;
}

/* ---------- Members ---------- */
function load_members(): array
{
    return read_private('users.php', ['users' => []])['users'] ?? [];
}

// changes when a password is reset, which signs out old sessions
function password_version(string $hash): string
{
    return substr(hash('sha256', $hash), 0, 16);
}

/* ---------- Sessions ---------- */
function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function start_session(bool $readOnly = false): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $dir = DATA_DIR . '/sessions';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) (SESSION_DAYS * 86400));
    session_save_path($dir);
    session_name('EFMEMBER');
    session_set_cookie_params([
        'lifetime' => SESSION_DAYS * 86400,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    // read-only requests (images, catalogue) must not lock the session file
    session_start($readOnly ? ['read_and_close' => true] : []);
}

// the signed-in member, or null; removed members and reset passwords lose access at once
function current_member(): ?array
{
    $email = $_SESSION['email'] ?? null;
    if (!is_string($email)) return null;
    $members = load_members();
    $m = $members[$email] ?? null;
    if (!$m || ($_SESSION['pv'] ?? '') !== password_version($m['hash'])) return null;
    return ['email' => $email, 'admin' => !empty($m['admin'])];
}

/* ---------- Login rate limit ---------- */
function client_key(): string
{
    // behind the Hostinger CDN the visitor address comes in X-Forwarded-For
    $fwd = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')[0]);
    return 'ip:' . ($fwd !== '' ? $fwd : ($_SERVER['REMOTE_ADDR'] ?? '?'));
}

function recent_failures(array $log, string $key): int
{
    $since = time() - LOGIN_WINDOW;
    return count(array_filter($log[$key] ?? [], fn($t) => $t > $since));
}

function login_blocked(string $email): bool
{
    $log = read_private('ratelimit.php', []);
    return recent_failures($log, 'email:' . $email) >= LOGIN_LIMIT_EMAIL
        || recent_failures($log, client_key()) >= LOGIN_LIMIT_CLIENT;
}

function note_login_failure(string $email): void
{
    $keys = ['email:' . $email, client_key()];
    update_private('ratelimit.php', [], function (array $log) use ($keys) {
        $since = time() - LOGIN_WINDOW;
        foreach ($log as $k => $times) {
            $log[$k] = array_values(array_filter($times, fn($t) => $t > $since));
            if (!$log[$k]) unset($log[$k]);
        }
        foreach ($keys as $k) $log[$k][] = time();
        return $log;
    });
}

/* ---------- Responses ---------- */
function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
