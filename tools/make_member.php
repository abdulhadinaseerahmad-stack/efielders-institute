<?php
/* Add or reset a Seller Program member from the command line.

   Usage (the password comes from an environment variable, never the command line):
       MEMBER_PASSWORD='...' php tools/make_member.php <path to members/data/users.php> <email> [--admin]

   Day-to-day, admins manage members at /members/admin.html instead. */
declare(strict_types=1);

if ($argc < 3) {
    fwrite(STDERR, "usage: MEMBER_PASSWORD=... php tools/make_member.php <users.php> <email> [--admin]\n");
    exit(1);
}
[$file, $email] = [$argv[1], strtolower(trim($argv[2]))];
$password = (string) getenv('MEMBER_PASSWORD');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) exit("invalid email\n");
if (strlen($password) < 8) exit("MEMBER_PASSWORD must be at least 8 characters\n");

$guard = "<?php http_response_code(404); exit; ?>\n";
$data = ['users' => []];
if (is_file($file)) {
    $raw = (string) file_get_contents($file);
    $data = json_decode(substr($raw, strpos($raw, "\n") + 1), true) ?: $data;
}
$data['users'][$email] = [
    'hash' => password_hash($password, PASSWORD_BCRYPT),
    'admin' => in_array('--admin', $argv, true),
    'created' => $data['users'][$email]['created'] ?? gmdate('Y-m-d H:i'),
];
file_put_contents($file, $guard . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
echo "saved $email" . ($data['users'][$email]['admin'] ? " (admin)" : "") . "\n";
