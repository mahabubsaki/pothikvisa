import fs from 'node:fs';
import path from 'node:path';

export interface WorkerTarget {
  id: string;
  name: string;
  proxyUrl?: string;
  outboundIp?: string;
  latencyMs?: number;
  profileDir: string;
}

interface RawProxyHealth {
  name: string;
  displayName?: string;
  type?: string;
  proxyUrl: string;
  status: 'online' | 'offline';
  ip?: string;
  latencyMs?: number;
  lastChecked?: number;
  reason?: string;
}

/**
 * Resolves healthy workers sorted by fastest latency directly from goethe-browser-automation's
 * benchmarked proxy health output (data/proxy-health.json) without duplicating VPN code.
 */
export async function resolveFastestWorkers(requestedCount = 10): Promise<WorkerTarget[]> {
  const healthPaths = [
    process.env.PROXY_HEALTH_FILE,
    path.resolve('D:\\goethe-browser-automation', 'data', 'proxy-health.json'),
    path.resolve(process.cwd(), 'data', 'proxy-health.json'),
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

  let onlineProxies: RawProxyHealth[] = [];

  for (const hPath of healthPaths) {
    try {
      const content = fs.readFileSync(hPath, 'utf8');
      const parsed: RawProxyHealth[] = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter strictly online nodes and sort by lowest latency
        onlineProxies = parsed
          .filter((p) => p.status === 'online' && p.proxyUrl)
          .sort((a, b) => (a.latencyMs ?? 9999) - (b.latencyMs ?? 9999));
        
        console.log(`🌐 [Worker Resolver] Loaded ${onlineProxies.length} online benchmarked proxy node(s) from: ${hPath}`);
        break;
      }
    } catch (err) {
      console.warn(`⚠️ [Worker Resolver] Error reading ${hPath}:`, err instanceof Error ? err.message : err);
    }
  }

  const workers: WorkerTarget[] = [];

  // Worker #1: Always include direct Home connection as an ultra-fast base option
  const baseProfileDir = path.resolve(process.cwd(), 'user_data_multi', 'profile_worker_home');
  if (!fs.existsSync(baseProfileDir)) {
    fs.mkdirSync(baseProfileDir, { recursive: true });
  }

  workers.push({
    id: 'home',
    name: 'Worker-Home',
    profileDir: baseProfileDir,
    latencyMs: 15, // Direct local fiber
  });

  // Add the fastest online benchmarked proxies
  for (const p of onlineProxies) {
    const safeName = p.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const profileDir = path.resolve(process.cwd(), 'user_data_multi', `profile_${safeName}`);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    workers.push({
      id: p.name,
      name: `Worker-${p.displayName || p.name}`,
      proxyUrl: p.proxyUrl,
      outboundIp: p.ip,
      latencyMs: p.latencyMs,
      profileDir,
    });
  }

  // Cap at requested count
  const selectedWorkers = workers.slice(0, Math.min(requestedCount, workers.length));

  console.log(`\n🚀 [Worker Resolver] Selected Top ${selectedWorkers.length} Fastest Worker(s):`);
  selectedWorkers.forEach((w, i) => {
    const detail = w.outboundIp ? `IP: ${w.outboundIp} (${w.latencyMs}ms)` : `Direct Local Connection (${w.latencyMs}ms)`;
    console.log(`   ${i + 1}. ${w.name.padEnd(25)} ➔ ${detail} [Proxy: ${w.proxyUrl || 'Direct'}]`);
  });
  console.log('');

  return selectedWorkers;
}
