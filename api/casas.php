<?php
// ============================================================
// CastDim — Menú de Casas
// Proxy hacia Monday.com: guarda el token en el servidor y solo
// entrega al navegador los campos necesarios para el catálogo
// público (nunca datos de clientes: nombre, RFC, teléfono, etc).
// ============================================================

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/config.php';

// Grupos de Monday.com (board "INVENTARIO 2.0") que pertenecen a
// cada desarrollo del menú público. Ajusta aquí si agregan o
// renombran privadas en Monday.
const DEVELOPMENT_GROUPS = [
    'terram' => [
        'grupo_nuevo29584', // TERRAM LOTES PRIVADA 1
        'group_mkq23a2t',   // TERRAM CASAS EXTERIORES
        'group_mkq26z4k',   // TERRAM CASAS PRIVADA 1
        'group_mm27zdbz',   // TERRAM LOTES PLURIFAMILIARES
    ],
    'sotavento' => [
        'grupo_nuevo70314',    // SOTAVENTO PRIVADA 1
        'grupo_nuevo53283',    // SOTAVENTO PRIVADA 2
        'grupo_nuevo94383__1', // SOTAVENTO PRIVADA 3
        'grupo_nuevo98399',    // SOTAVENTO PRIVADA 4
    ],
    'lanka' => [
        'grupo_nuevo75754', // LANKA
    ],
    'ankara' => [
        'ankara__arces___1', // ANKARA (ARCES)
    ],
];

// Columnas seguras que sí se piden a Monday y se muestran en el
// catálogo público. Nunca agregar aquí columnas de datos de cliente.
const SAFE_COLUMN_IDS = ['estado', 'estado4', 'estado6', 'estado63', 'n_meros', 'n_meros66', 'texto', 'texto3', 'texto4', 'fecha_17'];

// Status de Monday.com que se consideran "disponible" para el público.
const AVAILABLE_STATUSES = ['SIN VENDER'];

function respond(array $payload, int $httpCode = 200): void
{
    http_response_code($httpCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$desarrollo = isset($_GET['desarrollo']) ? strtolower(trim((string) $_GET['desarrollo'])) : '';

if (!array_key_exists($desarrollo, DEVELOPMENT_GROUPS)) {
    respond(['error' => 'Desarrollo inválido.', 'disponibles' => array_keys(DEVELOPMENT_GROUPS)], 400);
}

$cacheFile = __DIR__ . '/../cache/' . $desarrollo . '.json';

if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_TTL_SECONDS) {
    respond(['desarrollo' => $desarrollo, 'casas' => json_decode((string) file_get_contents($cacheFile), true), 'cache' => true]);
}

try {
    $casas = fetchCasasDeMonday($desarrollo);
    @file_put_contents($cacheFile, json_encode($casas, JSON_UNESCAPED_UNICODE));
    respond(['desarrollo' => $desarrollo, 'casas' => $casas, 'cache' => false]);
} catch (Throwable $e) {
    // Si Monday falla, servimos el último caché disponible aunque esté vencido.
    if (is_file($cacheFile)) {
        respond(['desarrollo' => $desarrollo, 'casas' => json_decode((string) file_get_contents($cacheFile), true), 'cache' => true, 'stale' => true]);
    }
    error_log('CastDim casas.php: ' . $e->getMessage());
    respond(['error' => 'No se pudo consultar el inventario en este momento.'], 502);
}

/**
 * @return array<int, array<string, mixed>>
 */
function fetchCasasDeMonday(string $desarrollo): array
{
    $groupIds = DEVELOPMENT_GROUPS[$desarrollo];
    $items = [];

    foreach ($groupIds as $groupId) {
        $cursor = null;
        do {
            [$pageItems, $cursor] = queryMondayGroupPage($groupId, $cursor);
            foreach ($pageItems as $item) {
                $items[] = $item;
            }
        } while ($cursor !== null);
    }

    $columnsById = [];
    $casas = [];

    foreach ($items as $item) {
        $columnsById = [];
        foreach ($item['column_values'] as $col) {
            $columnsById[$col['id']] = $col['text'];
        }

        $status = $columnsById['estado4'] ?? '';
        if (!in_array($status, AVAILABLE_STATUSES, true)) {
            continue;
        }

        $casas[] = [
            'id'            => $item['id'],
            'clave'         => $item['name'],
            'modelo'        => $columnsById['estado'] ?? '',
            'lote'          => $columnsById['texto'] ?? '',
            'manzana'       => $columnsById['texto4'] ?? '',
            'precio'        => parseNumeroMonday($columnsById['n_meros'] ?? ''),
            'precioM2'      => $columnsById['texto3'] ?? '',
            'm2Excedentes'  => parseNumeroMonday($columnsById['n_meros66'] ?? ''),
            'avanceObra'    => $columnsById['estado6'] ?? '',
            'entrega'       => $columnsById['estado63'] ?? '',
            'fechaEntrega'  => $columnsById['fecha_17'] ?? '',
        ];
    }

    return $casas;
}

/**
 * @return array{0: array<int, array{id: string, name: string, column_values: array<int, array{id: string, text: ?string}>}>, 1: ?string}
 */
function queryMondayGroupPage(string $groupId, ?string $cursor): array
{
    $columnIdsJson = json_encode(SAFE_COLUMN_IDS);

    if ($cursor === null) {
        $query = '{ boards(ids: ' . MONDAY_BOARD_ID . ') { groups(ids: ["' . $groupId . '"]) { items_page(limit: 100) { cursor items { id name column_values(ids: ' . $columnIdsJson . ') { id text } } } } } }';
    } else {
        $query = '{ next_items_page(cursor: "' . $cursor . '", limit: 100) { cursor items { id name column_values(ids: ' . $columnIdsJson . ') { id text } } } }';
    }

    $result = callMondayApi($query);

    if ($cursor === null) {
        $page = $result['data']['boards'][0]['groups'][0]['items_page'] ?? null;
    } else {
        $page = $result['data']['next_items_page'] ?? null;
    }

    if ($page === null) {
        return [[], null];
    }

    return [$page['items'], $page['cursor'] ?? null];
}

/**
 * @return array<string, mixed>
 */
function callMondayApi(string $query): array
{
    $ch = curl_init('https://api.monday.com/v2');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: ' . MONDAY_API_TOKEN,
            'Content-Type: application/json',
            'API-Version: 2024-10',
        ],
        CURLOPT_POSTFIELDS => json_encode(['query' => $query]),
    ]);

    $response = curl_exec($ch);
    $errNo = curl_errno($ch);
    $errMsg = curl_error($ch);
    curl_close($ch);

    if ($errNo !== 0) {
        throw new RuntimeException('Error de conexión con Monday.com: ' . $errMsg);
    }

    $decoded = json_decode((string) $response, true);
    if (!is_array($decoded) || isset($decoded['errors'])) {
        throw new RuntimeException('Monday.com respondió un error: ' . $response);
    }

    return $decoded;
}

function parseNumeroMonday(string $texto): ?float
{
    $limpio = preg_replace('/[^0-9.\-]/', '', $texto);
    if ($limpio === null || $limpio === '') {
        return null;
    }
    return (float) $limpio;
}
