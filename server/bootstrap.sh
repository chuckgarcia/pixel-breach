#!/bin/bash
# Pixel Breach — preparación única del backend en Google Cloud. Se corre UNA vez en Cloud Shell:
#   git clone https://github.com/chuckgarcia/pixel-breach && cd pixel-breach && bash server/bootstrap.sh
# Crea: secreto en Secret Manager, máquina e2-micro con coturn (nivel gratuito), servicio de credenciales
# en Cloud Run, acceso de GitHub Actions sin llaves (federación de identidad) y una alerta de presupuesto.
# Se puede volver a correr: lo que ya existe se deja como está.
set -euo pipefail
PROJECT=${1:-$(gcloud config get-value project 2>/dev/null)}
[ -n "$PROJECT" ] || { echo "Uso: bash server/bootstrap.sh ID_DEL_PROYECTO"; exit 1; }
REPO=chuckgarcia/pixel-breach
REGION=us-central1; ZONE=us-central1-a     # región incluida en el nivel gratuito de Compute Engine
VM=pixel-breach-turn; IP_NAME=pixel-breach-turn-ip; SECRET=pixel-breach-turn-secret; SERVICE=pixel-breach-creds
VM_SA=pb-turn-vm; RUN_SA=pb-creds-run; DEPLOY_SA=pb-deployer
gcloud config set project "$PROJECT" >/dev/null
NUM=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
sa(){ echo "$1@$PROJECT.iam.gserviceaccount.com"; }
exists(){ "$@" >/dev/null 2>&1; }
step(){ echo; echo "==> $*"; }

step "Activando servicios"
gcloud services enable compute.googleapis.com run.googleapis.com secretmanager.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  billingbudgets.googleapis.com cloudresourcemanager.googleapis.com

step "Secreto maestro en Secret Manager"
exists gcloud secrets describe $SECRET || { openssl rand -hex 32 | tr -d '\n' | gcloud secrets create $SECRET --replication-policy=automatic --data-file=-; }

step "Cuentas de servicio"
for a in $VM_SA $RUN_SA $DEPLOY_SA; do exists gcloud iam service-accounts describe "$(sa $a)" || gcloud iam service-accounts create $a --display-name="Pixel Breach $a"; done
for a in $VM_SA $RUN_SA; do
  gcloud secrets add-iam-policy-binding $SECRET --member="serviceAccount:$(sa $a)" --role=roles/secretmanager.secretAccessor >/dev/null
done

step "IP fija y firewall"
exists gcloud compute addresses describe $IP_NAME --region $REGION || gcloud compute addresses create $IP_NAME --region $REGION --network-tier PREMIUM
IP=$(gcloud compute addresses describe $IP_NAME --region $REGION --format='value(address)')
exists gcloud compute firewall-rules describe pb-turn || gcloud compute firewall-rules create pb-turn \
  --allow=udp:3478,tcp:3478,udp:49152-65535 --target-tags=pb-turn --description="Pixel Breach TURN"

step "Máquina e2-micro con coturn"
exists gcloud compute instances describe $VM --zone $ZONE || gcloud compute instances create $VM --zone $ZONE \
  --machine-type e2-micro --image-family debian-12 --image-project debian-cloud \
  --boot-disk-type pd-standard --boot-disk-size 30GB --address "$IP" --network-tier PREMIUM --tags pb-turn \
  --service-account "$(sa $VM_SA)" --scopes cloud-platform \
  --metadata-from-file startup-script=server/turn/setup.sh --metadata pb-rev=bootstrap

step "Servicio de credenciales en Cloud Run"
gcloud run deploy $SERVICE --source server/creds --region $REGION --quiet --allow-unauthenticated \
  --service-account "$(sa $RUN_SA)" --set-secrets TURN_SECRET=$SECRET:latest --set-env-vars TURN_HOST="$IP" \
  --memory 256Mi --max-instances 2 --min-instances 0
URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')

step "Acceso de GitHub Actions (sin llaves)"
exists gcloud iam workload-identity-pools describe github --location global || \
  gcloud iam workload-identity-pools create github --location global --display-name="GitHub"
exists gcloud iam workload-identity-pools providers describe github --location global --workload-identity-pool github || \
  gcloud iam workload-identity-pools providers create-oidc github --location global --workload-identity-pool github \
    --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository \
    --attribute-condition="assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding "$(sa $DEPLOY_SA)" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null
for r in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/storage.admin \
         roles/serviceusage.serviceUsageConsumer roles/compute.instanceAdmin.v1 roles/compute.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$(sa $DEPLOY_SA)" --role=$r --condition=None >/dev/null
done
for a in $VM_SA $RUN_SA; do
  gcloud iam service-accounts add-iam-policy-binding "$(sa $a)" --member="serviceAccount:$(sa $DEPLOY_SA)" --role=roles/iam.serviceAccountUser >/dev/null
done
# Cloud Build usa la cuenta de Compute por defecto para construir el servicio
CB_SA="$NUM-compute@developer.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding "$CB_SA" --member="serviceAccount:$(sa $DEPLOY_SA)" --role=roles/iam.serviceAccountUser >/dev/null 2>&1 || true

step "Alerta de presupuesto (1 USD)"
BILLING=$(gcloud billing projects describe "$PROJECT" --format='value(billingAccountName)' | sed 's#billingAccounts/##')
if [ -n "$BILLING" ]; then
  gcloud billing budgets list --billing-account "$BILLING" --format='value(displayName)' 2>/dev/null | grep -qx "Pixel Breach" || \
  gcloud billing budgets create --billing-account "$BILLING" --display-name "Pixel Breach" --budget-amount 1USD \
    --filter-projects "projects/$PROJECT" --threshold-rule percent=0.01 --threshold-rule percent=0.5 --threshold-rule percent=1.0 \
    || echo "   (No se pudo crear la alerta: créala en Facturación → Presupuestos y alertas)"
fi

cat <<FIN

==================== LISTO ====================
Copia este bloque y pásaselo a Claude:

GCP_PROJECT_ID=$PROJECT
GCP_WIF_PROVIDER=projects/$NUM/locations/global/workloadIdentityPools/github/providers/github
GCP_DEPLOY_SA=$(sa $DEPLOY_SA)
TURN_API=$URL/turn
TURN_IP=$IP
================================================
(Ninguno de estos datos es secreto. El secreto maestro se quedó en Secret Manager.)
FIN
