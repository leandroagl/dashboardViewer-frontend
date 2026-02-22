// ─── Modelos de dominio (espejo del backend) ──────────────────────────────────

export type UserRole = 'admin_ondra' | 'viewer' | 'viewer_kiosk';
export type DashboardType = 'servers' | 'backups' | 'networking' | 'windows';
export type SensorStatus = 'ok' | 'warning' | 'error' | 'unusual' | 'paused' | 'unknown';
export type AuditResult = 'ok' | 'error' | 'unauthorized';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken:           string;
  mustChangePassword:    boolean;
  rol:                   UserRole;
  clienteSlug:           string | null;
  dashboardsDisponibles: DashboardType[];
}

export interface AuthState {
  accessToken:   string | null;
  rol:           UserRole | null;
  clienteSlug:   string | null;
  dashboards:    DashboardType[];
  mustChangePwd: boolean;
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

export interface Client {
  id:               string;
  nombre:           string;
  slug:             string;
  prtg_group:       string;
  activo:           boolean;
  logo_url?:        string;
  color_marca?:     string;
  total_usuarios?:  number;
  ultimo_acceso_usuario?: string;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface User {
  id:                    string;
  email:                 string;
  nombre:                string;
  rol:                   UserRole;
  cliente_id:            string | null;
  cliente_nombre?:       string;
  activo:                boolean;
  debe_cambiar_password: boolean;
  es_kiosk:              boolean;
  ultimo_acceso?:        string;
  creado_en:             string;
}

export interface CreateUserPayload {
  email:      string;
  nombre:     string;
  rol:        UserRole;
  cliente_id?: string;
  es_kiosk?:  boolean;
}

// ─── Dashboards ───────────────────────────────────────────────────────────────

export interface StatusValue {
  value:  string;
  status: SensorStatus;
}

// VMware
export interface VmwareHost {
  name:       string;
  status:     SensorStatus;
  uptime:     string;
  cpu:        { value: string; pct: number; status: SensorStatus };
  memory:     { value: string; pct: number; status: SensorStatus };
  disk:       { read: { value: string; status: SensorStatus }; write: { value: string; status: SensorStatus } };
  vms:        { name: string; status: SensorStatus }[];
  datastores: { name: string; freePct: number; usedPct: number; status: SensorStatus }[];
  alerts:     { name: string; message: string; status: SensorStatus }[];
}

export interface VmwareDashboard {
  hosts:  VmwareHost[];
  alerts: { name: string; message: string; status: SensorStatus }[];
}

// Backups
export interface BackupJob {
  name:        string;
  lastStatus:  SensorStatus;
  lastMessage: string;
  lastValue:   string;
}

export interface BackupDevice {
  name:    string;
  type:    'veeam' | 'acronis' | 'qnap' | 'other';
  status:  SensorStatus;
  jobs:    BackupJob[];
  alerts:  { name: string; message: string }[];
}

export interface BackupsDashboard {
  successRate7d: number;
  devices:       BackupDevice[];
  alerts:        { name: string; message: string }[];
}

// Networking
export interface NetworkDevice {
  name:    string;
  status:  SensorStatus;
  sensors: { name: string; value: string; status: SensorStatus }[];
}
export interface NetworkingDashboard {
  devices:     NetworkDevice[];
  switches:    NetworkDevice[];
  ptpAntennas: NetworkDevice[];
  alerts:      { name: string; message: string; status: SensorStatus }[];
}

// Windows
export interface WindowsServer {
  name:   string;
  status: SensorStatus;
  cpu:    StatusValue;
  memory: StatusValue;
  disk:   StatusValue;
  uptime: StatusValue;
}
export interface WindowsDashboard {
  servers: WindowsServer[];
  alerts:  { name: string; message: string; status: SensorStatus }[];
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id:              string;
  timestamp:       string;
  usuario_id?:     string;
  usuario_nombre?: string;
  email?:          string;
  cliente_id?:     string;
  cliente_nombre?: string;
  accion:          string;
  dashboard?:      string;
  ip_origen:       string;
  resultado:       AuditResult;
}

export interface LogsMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  resumen: {
    total_eventos:    number;
    logins_exitosos:  number;
    logins_fallidos:  number;
    usuarios_activos: number;
  };
}

// ─── API Response genérico ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok:    boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: string;
}
