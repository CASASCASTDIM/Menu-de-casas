<?php
// ============================================================
// CONFIGURACIÓN — CastDim Menú de Casas
// Este archivo contiene credenciales reales. NO lo compartas,
// no lo publiques en un repositorio público, no lo pegues en chats.
// ============================================================

// Token de API de Monday.com (Perfil > Administración > API)
define('MONDAY_API_TOKEN', 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY5NDU2NTY2OCwiYWFpIjoxMSwidWlkIjoyNDgxOTQ2MywiaWFkIjoiMjAyNi0wOC0xOFQyMjozMDoxOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUyMjA4NSwicmduIjoidXNlMSJ9.rQXmiAvxpS9SJO2BXPoddWjCnoHw5N-qG0vv7p0iVRk');

// ID del board "INVENTARIO 2.0" en Monday.com
define('MONDAY_BOARD_ID', 2155783079);

// Cuánto tiempo (segundos) se reutiliza el caché local antes de
// volver a consultar Monday.com. Súbelo si quieres menos llamadas
// a la API; bájalo si necesitas datos más al instante.
define('CACHE_TTL_SECONDS', 300);
