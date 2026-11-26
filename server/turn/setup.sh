#!/bin/bash
# Pixel Breach — instala o actualiza el servidor TURN (coturn) en la máquina de Google Cloud.
# Corre al encender la máquina (startup-script) y cada vez que GitHub Actions publica una versión
# nueva de este archivo (el vigilante pb-watch detecta el cambio en los metadatos).
# Se puede correr las veces que sea: siempre deja todo en el mismo estado.
set -euo pipefail
SECRET_NAME=pixel-breach-turn-secret
MD=http://metadata.google.internal/computeMetadata/v1
md(){ curl -sf -H 'Metadata-Flavor: Google' "$MD/$1"; }

if ! command -v turnserver >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q && apt-get install -yq coturn
fi

EXT_IP=$(md instance/network-interfaces/0/access-configs/0/external-ip)
INT_IP=$(md instance/network-interfaces/0/ip)
# El secreto se lee de Secret Manager con la cuenta de servicio de la máquina; nunca está en el repo.
SECRET=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --quiet)

umask 077
cat > /etc/turnserver.conf.new <<CONF
# Generado por setup.sh — no editar a mano
listening-port=3478
listening-ip=$INT_IP
relay-ip=$INT_IP
external-ip=$EXT_IP/$INT_IP
min-port=49152
max-port=65535
realm=pixel-breach
use-auth-secret
static-auth-secret=$SECRET
fingerprint
no-tls
no-dtls
no-cli
no-multicast-peers
no-rfc5780
stale-nonce=600
# límites para que nadie abuse del servidor
user-quota=12
total-quota=60
max-bps=200000
bps-capacity=3000000
max-allocate-lifetime=7200
# no dejar que el relevo llegue a redes internas
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=224.0.0.0-255.255.255.255
simple-log
log-file=syslog
CONF
chmod 640 /etc/turnserver.conf.new && chown root:turnserver /etc/turnserver.conf.new
changed=1
if [ -f /etc/turnserver.conf ] && cmp -s /etc/turnserver.conf.new /etc/turnserver.conf; then changed=0; fi
mv /etc/turnserver.conf.new /etc/turnserver.conf
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn 2>/dev/null || true
systemctl enable coturn >/dev/null 2>&1
if [ "$changed" = 1 ] || ! systemctl is-active --quiet coturn; then systemctl restart coturn; fi

# Vigilante: cuando GitHub Actions cambia el metadato pb-rev, vuelve a correr este script.
cat > /usr/local/bin/pb-watch <<'W'
#!/bin/bash
MD=http://metadata.google.internal/computeMetadata/v1/instance/attributes
mkdir -p /var/lib/pb
while true; do
  rev=$(curl -sf -H 'Metadata-Flavor: Google' "$MD/pb-rev?wait_for_change=true&timeout_sec=600" || true)
  if [ -n "$rev" ] && [ "$rev" != "$(cat /var/lib/pb/rev 2>/dev/null)" ]; then
    if curl -sf -H 'Metadata-Flavor: Google' "$MD/startup-script" -o /var/lib/pb/setup.sh && bash /var/lib/pb/setup.sh; then
      echo "$rev" > /var/lib/pb/rev; logger -t pb-watch "aplicada la versión $rev"
    else logger -t pb-watch "falló la versión $rev"; sleep 60; fi
  fi
  sleep 5
done
W
chmod 755 /usr/local/bin/pb-watch
cat > /etc/systemd/system/pb-watch.service <<'S'
[Unit]
Description=Pixel Breach: aplica cambios publicados desde GitHub
After=network-online.target
[Service]
ExecStart=/usr/local/bin/pb-watch
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
S
systemctl daemon-reload
systemctl enable pb-watch >/dev/null 2>&1
systemctl is-active --quiet pb-watch || systemctl start pb-watch
mkdir -p /var/lib/pb
md instance/attributes/pb-rev > /var/lib/pb/rev 2>/dev/null || true
echo "TURN listo en $EXT_IP:3478"
