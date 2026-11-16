# Лабораторийн ажил — Minikube: Deployment + Service + Self-Healing

| | |
|---|---|
| **Төсөл** | Our-New-Web-App — Goal App |
| **Image** | `goal-app:1.0` ([`goal-app/Dockerfile`](../../goal-app/Dockerfile), Лаб 8) |
| **Manifest** | [`k8s/deployment.yaml`](../../k8s/deployment.yaml), [`k8s/service.yaml`](../../k8s/service.yaml) |

## Урьдчилсан нөхцөл

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) болон `kubectl` суусан
- Docker (эсвэл Minikube-ийн дотоод Docker) — image build / load

## 1. Cluster эхлүүлэх, шалгах

```bash
minikube start
kubectl get nodes
```

`Ready` төлөвтэй node харагдана.

## 2. Image-ийг Minikube-д бэлдэх

Кластер зөвхөн **Minikube доторх** (эсвэл load хийсэн) image-ийг ашиглана.

**Арга A — Minikube Docker дотор build (зөвлөмж):**

```bash
cd /path/to/Our-New-Web-App
eval $(minikube docker-env)
docker build -t goal-app:1.0 goal-app
```

`deployment.yaml` дээр `imagePullPolicy: IfNotPresent` (эсвэл зөвхөн локал build бол `Never`) үлдээнэ.

**Арга B — Host дээр build хийсэн image ачаалах:**

```bash
docker build -t goal-app:1.0 goal-app
minikube image load goal-app:1.0
```

## 3. Deployment, Service хэрэгжүүлэх

```bash
cd /path/to/Our-New-Web-App
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

```bash
kubectl get deployments
kubectl get pods -l app=goal-app
kubectl get svc goal-app
```

**Screenshot 1 (deliverable):** `kubectl get pods` — **3** pod `Running`, (жишээ нь) `goal-app-xxxxxxxx-xxxxx`.

## 4. Self-healing турших

Нэг pod сонгоод устгана:

```bash
kubectl delete pod <pod-name>
kubectl get pods -l app=goal-app -w
```

Deployment шинэ pod үүсгэнэ; нийт **3** replica хэвээр байна.

**Screenshot 2 (deliverable):** Устгасны дараа — шинэ pod `ContainerCreating` / `Running`, нэр өөрчлөгдсөн, тоо 3.

## 5. Апп руу хандах

```bash
minikube service goal-app --url
# эсвэл шууд нээх:
minikube service goal-app
```

Хөтөч Goal App-ийн нүүр хуудсыг (`HTTP 200`) харуулна.

> **Анхаар:** Энэ deployment зөвхөн **frontend** (Next.js). API нь `localhost:4000` гэж build-д бичигдсэн ([`goal-app/Dockerfile`](../../goal-app/Dockerfile)). Лабын зорилго — K8s Deployment/Service/self-healing; бүрэн backend-тэй ажиллуулах бол тусдаа backend Deployment эсвэл `docker compose` ашиглана.

## Хүлээлгэж өгөх зүйл

| Файл | Байршил |
|------|---------|
| `deployment.yaml` | `k8s/deployment.yaml` |
| `service.yaml` | `k8s/service.yaml` |
| Screenshot 1 | 3 Running pod |
| Screenshot 2 | Pod устгасны дараа self-heal |

## Ашигтай командууд

```bash
kubectl describe deployment goal-app
kubectl logs -l app=goal-app --tail=20
kubectl delete -f k8s/deployment.yaml -f k8s/service.yaml
minikube stop
```