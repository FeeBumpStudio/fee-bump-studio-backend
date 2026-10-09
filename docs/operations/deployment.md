# Deployment

## Build

The backend has no build step — plain Node.js:

```bash
# Verify syntax
node --check src/server.js

# Run tests
npm test
```

## Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/
COPY .env.example ./

# Non-root user
USER node

EXPOSE 8080

CMD ["node", "src/server.js"]
```

### Build Image

```bash
docker build -t fee-bump-studio-backend .
```

### Run Container

```bash
docker run -d \
  --name feebump-backend \
  -p 8080:8080 \
  -e STELLAR_NETWORK=mainnet \
  -e STELLAR_RPC_URL=https://rpc.stellar.org/your-project \
  -e STELLAR_CONTRACT_ID=CXYZ...MAINNET \
  fee-bump-studio-backend
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - STELLAR_NETWORK=mainnet
      - STELLAR_RPC_URL=https://rpc.stellar.org/your-project
      - STELLAR_CONTRACT_ID=CXYZ...MAINNET
      - DATABASE_URL=postgresql://user:pass@db:5432/feebumpstudio
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=feebumpstudio
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

## Kubernetes

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fee-bump-studio-backend
  labels:
    app: fee-bump-studio-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fee-bump-studio-backend
  template:
    metadata:
      labels:
        app: fee-bump-studio-backend
    spec:
      containers:
      - name: backend
        image: fee-bump-studio-backend:latest
        ports:
        - containerPort: 8080
        envFrom:
        - secretRef:
            name: feebumpstudio-secrets
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 20
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: fee-bump-studio-backend
spec:
  selector:
    app: fee-bump-studio-backend
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

### Secrets

```yaml
# k8s/secrets.yaml (apply via sealed-secrets or external-secrets)
apiVersion: v1
kind: Secret
metadata:
  name: feebumpstudio-secrets
type: Opaque
stringData:
  STELLAR_NETWORK: "mainnet"
  STELLAR_RPC_URL: "https://rpc.stellar.org/your-project"
  STELLAR_CONTRACT_ID: "CXYZ...MAINNET"
  DATABASE_URL: "postgresql://user:pass@postgres:5432/feebumpstudio"
  REDIS_URL: "redis://redis:6379"
```

## Environment Promotion

| Environment | Branch | Domain | Purpose |
|-------------|--------|--------|---------|
| **Development** | `main` (local) | `localhost:8080` | Developer testing |
| **Staging** | `main` (auto-deploy) | `staging-api.feebumpstudio.example.com` | Integration testing |
| **Production** | `main` (tagged release) | `api.feebumpstudio.example.com` | Live traffic |

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build image
        run: docker build -t fee-bump-studio-backend:${{ github.ref_name }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:${{ github.ref_name }}
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-set-context@v1
        with:
          kubeconfig: ${{ secrets.KUBECONFIG }}
      
      - name: Update image
        run: |
          kubectl set image deployment/fee-bump-studio-backend \
            backend=ghcr.io/${{ github.repository }}:${{ github.ref_name }}
      
      - name: Wait for rollout
        run: kubectl rollout status deployment/fee-bump-studio-backend
```

## Pre-Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] Docker image builds successfully
- [ ] Health endpoint responds
- [ ] Environment variables configured in target
- [ ] Secrets available in target
- [ ] Database migrations applied (if any)
- [ ] Contract deployed on target network
- [ ] RPC endpoint accessible from target
- [ ] Monitoring/alerting configured
- [ ] Rollback procedure documented

## Related Documentation

- [Environment Setup](environment-setup.md)
- [Monitoring](../operations/monitoring.md)
- [Runbook](../operations/runbook.md)